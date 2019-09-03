/* eslint-disable no-undef */

describe('branches', function() {
    beforeEach(function() {
        cy.createProject('bf', 'My Project', 'fr').then(() => cy.login());
    });

    afterEach(function() {
        cy.deleteProject('bf');
    });

    it('should be able to add a branch, edit the content and it should be saved', function() {
        cy.visit('/project/bf/stories');
        cy.get('[data-cy=open-chat]').click();
        cy.dataCy('create-branch').click({ force: true });
        cy.dataCy('branch-label').should('have.lengthOf', 2);
        cy.dataCy('story-editor')
            .get('textarea')
            .should('have.lengthOf', 2);
        cy.dataCy('story-editor')
            .get('textarea')
            .eq(1)
            .focus()
            .type('xxx', { force: true });
        cy.visit('/project/bf/stories');
        cy.get('[data-cy=open-chat]').click();
        cy.dataCy('branch-label').should('have.lengthOf', 2);
        cy.dataCy('create-branch').find('i').should('have.class', 'disabled');
        cy.dataCy('branch-label')
            .first()
            .click({ force: true });
        cy.contains('xxx').should('exist');
    });

    it('should be able to be create a third branch, and delete branches', function() {
        cy.visit('/project/bf/stories');
        cy.get('[data-cy=open-chat]').click();
        cy.dataCy('create-branch').click({ force: true });

        // create a third branch
        cy.dataCy('add-branch').click({ force: true });
        cy.dataCy('branch-label').should('have.lengthOf', 3);

        // delete a branch
        cy.dataCy('branch-label')
            .first()
            .click({ click: true });
        // delete branch is unclickable in cypress for ~100ms
        cy.wait(250);
        cy.dataCy('branch-label')
            .first()
            .trigger('mouseover');
        cy.wait(250);
        cy.dataCy('delete-branch')
            .first()
            .click({ force: true })
            .dataCy('confirm-yes')
            .click({ force: true });
        cy.dataCy('branch-label').should('have.lengthOf', 2);

        // delete a branch with only 2 branches remaining
        cy.dataCy('branch-label')
            .first()
            .trigger('mouseover');
        // delete branch is unclickable in cypress for ~100ms
        cy.wait(250);
        cy.dataCy('delete-branch')
            .first()
            .click({ force: true });
        cy.dataCy('confirm-popup')
            .contains('is also going to get deleted')
            .should('exist')
            .dataCy('confirm-yes')
            .click({ force: true });
        cy.dataCy('branch-label').should('not.exist', 2);
        cy.dataCy('create-branch').find('i').should('not.have.class', 'disabled');
    });
});
