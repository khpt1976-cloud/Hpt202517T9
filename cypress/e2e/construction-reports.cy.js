describe('Construction Reports', () => {
  beforeEach(() => {
    // Visit the construction reports page
    cy.visit('/construction-reports')
  })

  it('should load the construction reports page', () => {
    cy.url().should('include', '/construction-reports')
    cy.get('h1').should('contain', 'Construction Reports')
  })

  it('should display report templates', () => {
    // Check if templates are loaded
    cy.get('[data-testid="template-list"]').should('be.visible')
    
    // Should have at least one template
    cy.get('[data-testid="template-item"]').should('have.length.at.least', 1)
  })

  it('should allow navigation to editor', () => {
    // Click on first template to open editor
    cy.get('[data-testid="template-item"]').first().click()
    
    // Should navigate to editor page
    cy.url().should('include', '/construction-reports/editor/')
    
    // Editor should load
    cy.get('[data-testid="editor-container"]').should('be.visible')
  })

  it('should handle template settings', () => {
    // Check if settings panel exists
    cy.get('[data-testid="settings-panel"]').should('be.visible')
    
    // Should have image pages input
    cy.get('[data-testid="image-pages-input"]').should('be.visible')
    
    // Should have images per page input
    cy.get('[data-testid="images-per-page-input"]').should('be.visible')
  })
})

describe('Construction Reports Editor', () => {
  beforeEach(() => {
    // Navigate to editor with a test report
    cy.visit('/construction-reports')
    cy.get('[data-testid="template-item"]').first().click()
  })

  it('should load editor interface', () => {
    cy.get('[data-testid="editor-container"]').should('be.visible')
    cy.get('[data-testid="page-navigation"]').should('be.visible')
    cy.get('[data-testid="content-area"]').should('be.visible')
  })

  it('should navigate between pages', () => {
    // Check if page navigation works
    cy.get('[data-testid="next-page-btn"]').should('be.visible')
    cy.get('[data-testid="prev-page-btn"]').should('be.visible')
    
    // Navigate to next page
    cy.get('[data-testid="next-page-btn"]').click()
    
    // Page number should update
    cy.get('[data-testid="current-page"]').should('not.contain', '1')
  })

  it('should toggle edit mode', () => {
    // Should have edit toggle button
    cy.get('[data-testid="edit-toggle"]').should('be.visible')
    
    // Click to enter edit mode
    cy.get('[data-testid="edit-toggle"]').click()
    
    // Rich text editor should appear
    cy.get('[data-testid="rich-text-editor"]').should('be.visible')
  })

  it('should handle keyboard shortcuts', () => {
    // Test arrow key navigation
    cy.get('body').type('{rightarrow}')
    
    // Should navigate to next page
    cy.get('[data-testid="current-page"]').should('not.contain', '1')
    
    // Test left arrow to go back
    cy.get('body').type('{leftarrow}')
    
    // Should go back to first page
    cy.get('[data-testid="current-page"]').should('contain', '1')
  })

  it('should show export options', () => {
    // Export button should be visible
    cy.get('[data-testid="export-btn"]').should('be.visible')
    
    // Click export button
    cy.get('[data-testid="export-btn"]').click()
    
    // Export modal should appear
    cy.get('[data-testid="export-modal"]').should('be.visible')
    
    // Should have format options
    cy.get('[data-testid="export-format-pdf"]').should('be.visible')
    cy.get('[data-testid="export-format-png"]').should('be.visible')
  })
})