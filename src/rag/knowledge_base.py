import json
import os
import re
from pathlib import Path
from collections import Counter

from src.core.config import settings
from src.core.models import KnowledgeItem

class KnowledgeBase:
    """
    Manages the Retrieval-Augmented Generation (RAG) backend without local ML models.
    This class handles loading files (PDFs, TXT, JSON), chunking the text into smaller pieces, 
    and storing them in memory.
    It provides a fast, pure-Python keyword matching search functionality.
    """
    def __init__(self):
        # Store documents purely in memory (no local ML vectors)
        self.documents = []

    @property
    def collection(self):
        class _CollectionProxy:
            def __init__(self, kb):
                self._kb = kb
            def count(self):
                return len(self._kb.documents)
        return _CollectionProxy(self)

    def count(self) -> int:
        return len(self.documents)

    def ingest_file(self, file_path: str) -> int:
        ext = Path(file_path).suffix.lower()
        text = ""
        
        # Handle different file extensions gracefully
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        elif ext == ".pdf":
            try:
                import PyPDF2
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    text = "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                text = f"[PDF content could not be extracted from {file_path}]"
        elif ext == ".docx":
            try:
                from docx import Document
                doc = Document(file_path)
                text = "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                text = f"[DOCX content could not be extracted from {file_path}]"
        elif ext == ".json":
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            title = ""
            if isinstance(data, list):
                text = "\n\n".join(self._json_item_to_text(item) for item in data)
            elif isinstance(data, dict):
                title = str(data.get("title", "")).strip()
                text = self._json_item_to_text(data)
            meta = {"source": file_path}
            if title:
                meta["title"] = title
            if not text.strip():
                return 0
            return self._chunk_and_index(text, meta)
        elif ext in (".md", ".csv", ".html"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        if not text.strip():
            return 0

        return self._chunk_and_index(text, {"source": file_path})

    @staticmethod
    def _json_item_to_text(item) -> str:
        """Turn a knowledge JSON record into clean, human-readable, searchable text."""
        if not isinstance(item, dict):
            return str(item)
        parts = []
        if item.get("title"):
            parts.append(str(item["title"]))
        content = item.get("content") or item.get("text") or item.get("answer") or ""
        if content:
            parts.append(str(content))
        keywords = item.get("keywords")
        if isinstance(keywords, list) and keywords:
            parts.append("Keywords: " + ", ".join(str(k) for k in keywords))
        if not parts:
            # Fall back to a readable key: value rendering rather than raw JSON braces
            parts = [f"{k}: {v}" for k, v in item.items()]
        return "\n".join(parts)

    def ingest_directory(self, directory: str | None = None) -> int:
        directory = directory or settings.knowledge_base_dir
        total = 0
        if not os.path.isdir(directory):
            return 0
        for fname in os.listdir(directory):
            fpath = os.path.join(directory, fname)
            if os.path.isfile(fpath):
                total += self.ingest_file(fpath)
        return total

    def _chunk_and_index(self, text: str, metadata: dict) -> int:
        chunks = self._split_text(text)
        if not chunks:
            return 0
            
        base_id = metadata.get("source", "manual").replace("\\", "_").replace("/", "_")
        
        added_count = 0
        for i, chunk_text in enumerate(chunks):
            if not chunk_text.strip():
                continue
            
            # Store the chunk with basic tokenization for fast matching
            tokens = set(re.findall(r'\b\w+\b', chunk_text.lower()))
            
            self.documents.append({
                "id": f"{base_id}_chunk_{i}",
                "text": chunk_text.strip(),
                "tokens": tokens,
                "metadata": metadata
            })
            added_count += 1
            
        return added_count

    def _split_text(self, text: str) -> list[str]:
        paragraphs = re.split(r"\n\s*\n", text)
        chunks = []
        buffer = ""
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(buffer) + len(para) < settings.chunk_size:
                buffer += "\n" + para if buffer else para
            else:
                if buffer:
                    chunks.append(buffer)
                buffer = para
        if buffer:
            chunks.append(buffer)

        result = []
        for chunk in chunks:
            if len(chunk) > settings.chunk_size * 1.5:
                sentences = re.split(r"(?<=[.!?])\s+", chunk)
                sub = ""
                for s in sentences:
                    if len(sub) + len(s) > settings.chunk_size and sub:
                        result.append(sub)
                        sub = s
                    else:
                        sub += " " + s if sub else s
                if sub:
                    result.append(sub)
            else:
                result.append(chunk)
        return result

    def search(self, query: str, top_k: int = 3) -> list[KnowledgeItem]:
        """
        Searches the stored documents using a fast pure-Python keyword overlap metric.
        This entirely replaces ChromaDB and ensures ZERO local ML models are used.
        """
        if not self.documents:
            return []
            
        query_tokens = set(re.findall(r'\b\w+\b', query.lower()))
        if not query_tokens:
            return []
            
        scored_docs = []
        for doc in self.documents:
            # Calculate simple Jaccard-like overlap score
            overlap = len(query_tokens.intersection(doc["tokens"]))
            score = overlap / max(len(query_tokens), 1)
            
            # Only consider docs with at least some overlap
            if score > 0:
                scored_docs.append((score, doc))
                
        # Sort by highest score
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        kb_results = []
        for score, doc in scored_docs[:top_k]:
            source = doc["metadata"].get("source", "knowledge")
            title = doc["metadata"].get("title") or self._prettify_source(source)

            kb_results.append(KnowledgeItem(
                title=title,
                content=doc["text"],
                relevance_score=round(score, 2),
                source=source
            ))
                
        return kb_results

    def add_text(self, text: str, source: str = "manual") -> int:
        return self._chunk_and_index(text, {"source": source})

    @staticmethod
    def _prettify_source(source: str) -> str:
        """Turn 'data/knowledge_base/faq_payment_failed.json' into 'Faq Payment Failed'."""
        base = os.path.splitext(os.path.basename(str(source)))[0]
        return base.replace("_", " ").replace("-", " ").strip().title() or "Knowledge Article"


knowledge_base = KnowledgeBase()
