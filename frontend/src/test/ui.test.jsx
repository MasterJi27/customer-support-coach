import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider, useToast } from '../components/ToastContext'
import { ThemeProvider } from '../components/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import JiraBoard from '../pages/JiraBoard'

function TestToaster() {
  const toast = useToast()
  return (
    <button onClick={() => toast.success('Saved successfully')}>
      Fire toast
    </button>
  )
}

const wrapper = ({ children }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('ToastContext', () => {
  it('shows a toast message when fired', async () => {
    render(<TestToaster />, { wrapper })
    await userEvent.click(screen.getByText('Fire toast'))
    await waitFor(() => expect(screen.getByText('Saved successfully')).toBeInTheDocument())
  })

  it('renders children without error', () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <div>content</div>
        </ToastProvider>
      </ThemeProvider>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

describe('ErrorBoundary', () => {
  function Bomb() {
    throw new Error('boom')
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })
})

describe('JiraBoard', () => {
  it('renders empty state when no tickets exist', () => {
    render(<JiraBoard />, { wrapper })
    expect(screen.getByText('No tickets yet')).toBeInTheDocument()
    expect(screen.getByText('Generate Ticket')).toBeInTheDocument()
    expect(screen.getByText(/Tickets are stored locally/)).toBeInTheDocument()
  })
})
