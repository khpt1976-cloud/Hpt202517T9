// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login (if authentication is implemented)
Cypress.Commands.add('login', (username = 'testuser', password = 'testpass') => {
  // Implementation would depend on your auth system
  cy.log('Login command - to be implemented when auth is added')
})

// Custom command to navigate to construction reports
Cypress.Commands.add('goToConstructionReports', () => {
  cy.visit('/construction-reports')
  cy.url().should('include', '/construction-reports')
})

// Custom command to wait for page content to load
Cypress.Commands.add('waitForPageContent', () => {
  cy.get('[data-testid="page-content"]', { timeout: 10000 }).should('be.visible')
})

// Custom command to navigate to specific page in editor
Cypress.Commands.add('navigateToPage', (pageNumber) => {
  cy.get(`[data-testid="page-${pageNumber}"]`).click()
  cy.get('[data-testid="current-page"]').should('contain', pageNumber.toString())
})