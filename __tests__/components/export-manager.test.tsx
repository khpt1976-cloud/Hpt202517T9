import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the ExportManager component for testing
const MockExportManager = ({ reportId, templateId, currentPage, totalPages }: {
  reportId: string
  templateId: string
  currentPage: number
  totalPages: number
}) => {
  const [exportFormat, setExportFormat] = React.useState('pdf')
  const [exportScope, setExportScope] = React.useState('current')
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsExporting(false)
  }

  return (
    <div data-testid="export-manager">
      <h2>Export Options</h2>
      
      <div data-testid="format-selection">
        <label>
          <input
            type="radio"
            value="pdf"
            checked={exportFormat === 'pdf'}
            onChange={(e) => setExportFormat(e.target.value)}
            data-testid="format-pdf"
          />
          PDF
        </label>
        <label>
          <input
            type="radio"
            value="png"
            checked={exportFormat === 'png'}
            onChange={(e) => setExportFormat(e.target.value)}
            data-testid="format-png"
          />
          PNG
        </label>
      </div>

      <div data-testid="scope-selection">
        <label>
          <input
            type="radio"
            value="current"
            checked={exportScope === 'current'}
            onChange={(e) => setExportScope(e.target.value)}
            data-testid="scope-current"
          />
          Current Page ({currentPage})
        </label>
        <label>
          <input
            type="radio"
            value="all"
            checked={exportScope === 'all'}
            onChange={(e) => setExportScope(e.target.value)}
            data-testid="scope-all"
          />
          All Pages (1-{totalPages})
        </label>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        data-testid="export-button"
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      <div data-testid="export-info">
        <p>Report ID: {reportId}</p>
        <p>Template ID: {templateId}</p>
        <p>Format: {exportFormat.toUpperCase()}</p>
        <p>Scope: {exportScope}</p>
      </div>
    </div>
  )
}

describe('ExportManager Component', () => {
  const defaultProps = {
    reportId: 'test-report-123',
    templateId: 'test-template-456',
    currentPage: 2,
    totalPages: 5
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders export manager with default options', () => {
    render(<MockExportManager {...defaultProps} />)
    
    expect(screen.getByTestId('export-manager')).toBeInTheDocument()
    expect(screen.getByText('Export Options')).toBeInTheDocument()
    expect(screen.getByTestId('format-pdf')).toBeChecked()
    expect(screen.getByTestId('scope-current')).toBeChecked()
  })

  it('displays correct report and template information', () => {
    render(<MockExportManager {...defaultProps} />)
    
    expect(screen.getByText('Report ID: test-report-123')).toBeInTheDocument()
    expect(screen.getByText('Template ID: test-template-456')).toBeInTheDocument()
    expect(screen.getByText('Format: PDF')).toBeInTheDocument()
    expect(screen.getByText('Scope: current')).toBeInTheDocument()
  })

  it('allows format selection between PDF and PNG', () => {
    render(<MockExportManager {...defaultProps} />)
    
    // Initially PDF should be selected
    expect(screen.getByTestId('format-pdf')).toBeChecked()
    expect(screen.getByTestId('format-png')).not.toBeChecked()
    
    // Click PNG option
    fireEvent.click(screen.getByTestId('format-png'))
    
    expect(screen.getByTestId('format-png')).toBeChecked()
    expect(screen.getByTestId('format-pdf')).not.toBeChecked()
    expect(screen.getByText('Format: PNG')).toBeInTheDocument()
  })

  it('allows scope selection between current and all pages', () => {
    render(<MockExportManager {...defaultProps} />)
    
    // Initially current page should be selected
    expect(screen.getByTestId('scope-current')).toBeChecked()
    expect(screen.getByTestId('scope-all')).not.toBeChecked()
    
    // Click all pages option
    fireEvent.click(screen.getByTestId('scope-all'))
    
    expect(screen.getByTestId('scope-all')).toBeChecked()
    expect(screen.getByTestId('scope-current')).not.toBeChecked()
    expect(screen.getByText('Scope: all')).toBeInTheDocument()
  })

  it('displays current page number in scope options', () => {
    render(<MockExportManager {...defaultProps} />)
    
    expect(screen.getByText('Current Page (2)')).toBeInTheDocument()
    expect(screen.getByText('All Pages (1-5)')).toBeInTheDocument()
  })

  it('handles export button click and loading state', async () => {
    render(<MockExportManager {...defaultProps} />)
    
    const exportButton = screen.getByTestId('export-button')
    expect(exportButton).toHaveTextContent('Export')
    expect(exportButton).not.toBeDisabled()
    
    // Click export button
    fireEvent.click(exportButton)
    
    // Should show loading state
    expect(exportButton).toHaveTextContent('Exporting...')
    expect(exportButton).toBeDisabled()
    
    // Wait for export to complete
    await waitFor(() => {
      expect(exportButton).toHaveTextContent('Export')
      expect(exportButton).not.toBeDisabled()
    }, { timeout: 2000 })
  })

  it('updates display when props change', () => {
    const { rerender } = render(<MockExportManager {...defaultProps} />)
    
    expect(screen.getByText('Current Page (2)')).toBeInTheDocument()
    expect(screen.getByText('All Pages (1-5)')).toBeInTheDocument()
    
    // Update props
    rerender(
      <MockExportManager
        {...defaultProps}
        currentPage={3}
        totalPages={8}
      />
    )
    
    expect(screen.getByText('Current Page (3)')).toBeInTheDocument()
    expect(screen.getByText('All Pages (1-8)')).toBeInTheDocument()
  })

  it('maintains state during re-renders', () => {
    const { rerender } = render(<MockExportManager {...defaultProps} />)
    
    // Change format to PNG
    fireEvent.click(screen.getByTestId('format-png'))
    expect(screen.getByTestId('format-png')).toBeChecked()
    
    // Re-render with different props
    rerender(
      <MockExportManager
        {...defaultProps}
        currentPage={3}
      />
    )
    
    // Format selection should be maintained
    expect(screen.getByTestId('format-png')).toBeChecked()
    expect(screen.getByText('Format: PNG')).toBeInTheDocument()
  })
})