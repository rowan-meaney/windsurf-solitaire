class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.faceUp = false;
        this.element = this.createCardElement();
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.suit = this.suit;
        card.dataset.rank = this.rank;
        this.updateCardDisplay(card);
        return card;
    }

    updateCardDisplay(element) {
        // Preserve existing classes that might have been added for dragging
        const existingClasses = Array.from(element.classList)
            .filter(cls => !['card', 'red', 'black', 'face-up', 'face-down'].includes(cls));
            
        if (this.faceUp) {
            const isRed = this.suit === '♥' || this.suit === '♦';
            element.className = `card ${isRed ? 'red' : 'black'} face-up ${existingClasses.join(' ')}`;
            
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            
            const topRank = document.createElement('div');
            topRank.className = 'rank top';
            topRank.textContent = `${this.rank}${this.suit}`;
            
            const bottomRank = document.createElement('div');
            bottomRank.className = 'rank bottom';
            bottomRank.textContent = `${this.rank}${this.suit}`;
            
            const centerSuit = document.createElement('div');
            centerSuit.className = 'center-suit';
            centerSuit.textContent = this.suit;
            
            element.innerHTML = '';
            cardContent.appendChild(topRank);
            cardContent.appendChild(centerSuit);
            cardContent.appendChild(bottomRank);
            element.appendChild(cardContent);
            
            // Add hover listener for face-up cards
            if (!element.hasAttribute('data-hover-initialized')) {
                element.setAttribute('data-hover-initialized', 'true');
                element.addEventListener('mouseenter', () => {
                    if (this.faceUp) {
                        element.style.setProperty('--z-index', '1000');
                    }
                });
                element.addEventListener('mouseleave', () => {
                    if (this.faceUp) {
                        element.style.removeProperty('--z-index');
                    }
                });
            }
        } else {
            element.className = `card face-down ${existingClasses.join(' ')}`;
            element.innerHTML = '<div class="card-back"></div>';
        }
    }

    flip() {
        this.faceUp = !this.faceUp;
        this.updateCardDisplay(this.element);
    }
}

class Solitaire {
    constructor() {
        this.initializeGame();
        
        // Clean up drag state when mouse leaves window
        window.addEventListener('mouseleave', () => {
            this.draggedCard = null;
            this.dragSourceStackId = null;
        });
    }

    initializeDeck() {
        const suits = ['♥', '♦', '♣', '♠'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push(new Card(suit, rank));
            }
        }
        
        // Shuffle the deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    setupGame() {
        // Deal cards to tableaus
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                if (i === j) {
                    card.faceUp = true;
                    card.updateCardDisplay(card.element);
                }
                this.tableaus[j].push(card);
                this.updateTableauDisplay(j);
            }
        }

        // Setup deck display
        this.updateDeckDisplay();
        
        // Setup initial drag and drop
        this.setupDragAndDrop();
    }

    updateDeckDisplay() {
        const deckElement = document.getElementById('deck');
        deckElement.innerHTML = '';
        if (this.deck.length > 0) {
            const topCard = this.deck[this.deck.length - 1];
            topCard.faceUp = false;
            
            // Position card with transform for perfect centering
            topCard.element.style.transform = 'translate(-50%, -50%)';
            topCard.element.style.left = '50%';
            topCard.element.style.top = '50%';
            
            topCard.updateCardDisplay(topCard.element);
            deckElement.appendChild(topCard.element);
        }
    }

    updateWasteDisplay() {
        const wasteElement = document.getElementById('waste');
        wasteElement.innerHTML = '';
        if (this.waste.length > 0) {
            const topCard = this.waste[this.waste.length - 1];
            topCard.faceUp = true;
            
            // Position card with transform for perfect centering
            topCard.element.style.transform = 'translate(-50%, -50%)';
            topCard.element.style.left = '50%';
            topCard.element.style.top = '50%';
            
            topCard.updateCardDisplay(topCard.element);
            wasteElement.appendChild(topCard.element);
            // Set up drag and drop for the new waste card
            this.setupCardDragAndDrop([topCard.element]);
        }
    }

    updateTableauDisplay(index) {
        const tableauElement = document.getElementById(`tableau-${index}`);
        tableauElement.innerHTML = '';
        
        // Calculate base z-index for this tableau
        const baseZIndex = index * 100;
        
        this.tableaus[index].forEach((card, i) => {
            // Position card with transform for perfect centering
            card.element.style.transform = 'translateX(-50%)';
            card.element.style.top = `${i * 30}px`;
            card.element.style.left = '50%';
            
            // Set card index and z-index
            card.element.style.setProperty('--card-index', baseZIndex + i);
            card.element.style.zIndex = baseZIndex + i;
            
            // Add data attributes for better targeting in CSS
            card.element.dataset.position = i;
            card.element.dataset.tableauIndex = index;
            card.element.dataset.stackSize = this.tableaus[index].length;
            
            // Ensure the card display matches its state
            card.updateCardDisplay(card.element);
            
            // Append to tableau
            tableauElement.appendChild(card.element);
        });
        
        // Set up drag and drop for any new cards
        this.setupCardDragAndDrop(tableauElement.querySelectorAll('.card'));
    }

    updateFoundationDisplay(index) {
        const foundationElement = document.getElementById(`foundation-${index}`);
        foundationElement.innerHTML = '';
        if (this.foundations[index].length > 0) {
            const topCard = this.foundations[index][this.foundations[index].length - 1];
            topCard.faceUp = true;
            
            // Position card with transform for perfect centering
            topCard.element.style.transform = 'translate(-50%, -50%)';
            topCard.element.style.left = '50%';
            topCard.element.style.top = '50%';
            
            topCard.updateCardDisplay(topCard.element);
            foundationElement.appendChild(topCard.element);
        }
    }

    initializeGame() {
        // Store current positions of all cards for smooth animation
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            card.style.position = 'fixed';
            card.style.top = rect.top + 'px';
            card.style.left = rect.left + 'px';
            card.style.width = rect.width + 'px';
            card.style.height = rect.height + 'px';
            card.style.transition = 'all 0.3s ease-out';
            card.style.transform = 'none';
            
            // Trigger reflow
            card.offsetHeight;
            
            // Animate out
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8) translateY(-20px)';
        });
        
        // Wait for animation to complete before clearing and setting up new game
        setTimeout(() => {
            // Clear all stacks
            this.clearAllStacks();
            
            // Reset game state
            this.deck = [];
            this.waste = [];
            this.foundations = Array(4).fill().map(() => []);
            this.tableaus = Array(7).fill().map(() => []);
            this.draggedCard = null;
            this.dragSourceStackId = null;
            
            // Initialize and setup new game
            this.initializeDeck();
            this.setupGame();
            this.setupEventListeners();
            
            // Add fade-in animation to new cards
            requestAnimationFrame(() => {
                document.querySelectorAll('.card').forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8) translateY(-20px)';
                    card.style.transition = 'all 0.3s ease-out';
                    
                    // Trigger reflow
                    card.offsetHeight;
                    
                    card.style.opacity = '1';
                    if (card.closest('.tableau-area')) {
                        card.style.transform = 'translateX(-50%)';
                    } else {
                        card.style.transform = 'translate(-50%, -50%)';
                    }
                });
            });
        }, 300);
    }
    
    clearAllStacks() {
        // Clear waste pile
        document.getElementById('waste').innerHTML = '';
        
        // Clear deck
        document.getElementById('deck').innerHTML = '';
        
        // Clear foundations
        for (let i = 0; i < 4; i++) {
            document.getElementById(`foundation-${i}`).innerHTML = '';
        }
        
        // Clear tableaus
        for (let i = 0; i < 7; i++) {
            document.getElementById(`tableau-${i}`).innerHTML = '';
        }
    }

    setupEventListeners() {
        // Restart button event
        const restartButton = document.getElementById('restart-button');
        if (restartButton && !restartButton.hasAttribute('data-listener-initialized')) {
            restartButton.setAttribute('data-listener-initialized', 'true');
            restartButton.addEventListener('click', () => {
                // Disable the button temporarily to prevent multiple clicks
                restartButton.disabled = true;
                
                // Add spin animation to the SVG
                const svg = restartButton.querySelector('svg');
                svg.style.animation = 'spin 1s ease-in-out';
                
                // Reset the game
                this.initializeGame();
                
                // Re-enable the button and reset animation after transition
                setTimeout(() => {
                    restartButton.disabled = false;
                    svg.style.animation = '';
                }, 1000);
            });
        }

        // Deck click event
        document.getElementById('deck').addEventListener('click', () => {
            if (this.deck.length === 0) {
                // Reset deck from waste
                while (this.waste.length > 0) {
                    const card = this.waste.pop();
                    card.faceUp = false;
                    card.updateCardDisplay(card.element);
                    this.deck.unshift(card);
                }
                this.updateWasteDisplay(); // Clear waste pile first
                this.updateDeckDisplay(); // Then show the new deck
            } else {
                const card = this.deck.pop();
                card.faceUp = true;
                card.updateCardDisplay(card.element);
                this.waste.push(card);
                this.updateDeckDisplay(); // Update deck first to show it's empty
                this.updateWasteDisplay(); // Then show the new card in waste
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();

        // Check for win condition after each move
        this.checkWinCondition();
    }

    handleCardClick(e) {
        const card = this.findCardFromElement(e.target);
        if (!card) return;

        // Double click to auto-move to foundation if possible
        if (e.detail === 2) {
            for (let i = 0; i < this.foundations.length; i++) {
                if (this.canMoveToFoundation(card, i)) {
                    const sourceStackId = e.target.closest('.card-stack').id;
                    this.moveToFoundation(card, sourceStackId, i);
                    break;
                }
            }
        }
    }

    checkWinCondition() {
        // Check if all foundations are complete
        const isComplete = this.foundations.every(foundation => {
            return foundation.length === 13;
        });

        if (isComplete) {
            setTimeout(() => {
                alert('Congratulations! You won!');
            }, 500);
        }
    }

    setupDragAndDrop() {
        // We'll set up drag and drop for each card as it's created
        this.setupCardDragAndDrop(document.querySelectorAll('.card'));
        
        // Set up drop zones
        const dropZones = document.querySelectorAll('.card-stack');
        dropZones.forEach(zone => {
            if (!zone.hasAttribute('data-drop-initialized')) {
                zone.setAttribute('data-drop-initialized', 'true');
                zone.addEventListener('dragover', this.handleDragOver.bind(this));
                zone.addEventListener('drop', this.handleDrop.bind(this));
            }
        });
    }

    setupCardDragAndDrop(elements) {
        elements.forEach(element => {
            if (!element.hasAttribute('draggable')) {
                element.setAttribute('draggable', true);
                element.addEventListener('dragstart', this.handleDragStart.bind(this));
                element.addEventListener('dragend', this.handleDragEnd.bind(this));
                element.addEventListener('click', this.handleCardClick.bind(this));
                element.addEventListener('mouseenter', () => {
                    if (element.classList.contains('face-up')) {
                        const isTableau = element.closest('.tableau-area');
                        if (isTableau) {
                            element.style.transform = 'translate(-50%, -10px)';
                        } else {
                            element.style.transform = 'translate(-50%, -50%) scale(1.02)';
                        }
                    }
                });
                element.addEventListener('mouseleave', () => {
                    const isTableau = element.closest('.tableau-area');
                    if (isTableau) {
                        element.style.transform = 'translateX(-50%)';
                    } else {
                        element.style.transform = 'translate(-50%, -50%)';
                    }
                });
            }
        });
    }

    handleDragStart(e) {
        const cardElement = e.target.closest('.card');
        if (!cardElement) return;

        const card = this.findCardFromElement(cardElement);
        if (!card || !card.faceUp) {
            e.preventDefault();
            return;
        }

        // Store the stack ID and card for reference
        this.dragSourceStackId = cardElement.closest('.card-stack').id;
        this.draggedCard = card;
        
        // Add visual feedback
        cardElement.classList.add('dragging');
        cardElement.style.opacity = '0.6';
        
        const isTableau = cardElement.closest('.tableau-area');
        if (isTableau) {
            cardElement.style.transform = 'translate(-50%, -10px) scale(1.02)';
        } else {
            cardElement.style.transform = 'translate(-50%, -50%) scale(1.02)';
        }

        // Set drag image
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
        }
    }

    handleDragEnd(e) {
        const cardElement = e.target.closest('.card');
        if (cardElement) {
            cardElement.classList.remove('dragging');
            cardElement.style.opacity = '';
            
            const isTableau = cardElement.closest('.tableau-area');
            if (isTableau) {
                cardElement.style.transform = 'translateX(-50%)';
            } else {
                cardElement.style.transform = 'translate(-50%, -50%)';
            }
        }
        
        // Clear drag state
        this.draggedCard = null;
        this.dragSourceStackId = null;

        // Remove any temporary drag styles from all cards and stacks
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('dragging');
            card.style.opacity = '';
            const isTableauCard = card.closest('.tableau-area');
            if (isTableauCard) {
                card.style.transform = 'translateX(-50%)';
            } else {
                card.style.transform = 'translate(-50%, -50%)';
            }
        });
        document.querySelectorAll('.card-stack').forEach(stack => {
            stack.classList.remove('valid-drop-target', 'invalid-drop-target');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }

        // Add visual feedback for valid drop targets
        const targetStack = e.target.closest('.card-stack');
        if (targetStack && this.draggedCard) {
            const targetStackId = targetStack.id;
            
            // Don't highlight the source stack
            if (targetStackId === this.dragSourceStackId) return;

            // Remove highlight from all stacks first
            document.querySelectorAll('.card-stack').forEach(stack => {
                stack.classList.remove('valid-drop-target', 'invalid-drop-target');
            });

            // Check if this would be a valid move
            let isValidMove = false;
            if (targetStackId.startsWith('foundation-')) {
                const foundationIndex = parseInt(targetStackId.split('-')[1]);
                isValidMove = this.canMoveToFoundation(this.draggedCard, foundationIndex);
            } else if (targetStackId.startsWith('tableau-')) {
                const tableauIndex = parseInt(targetStackId.split('-')[1]);
                isValidMove = this.canMoveToTableau(this.draggedCard, tableauIndex);
            }

            // Add appropriate class for visual feedback
            targetStack.classList.add(isValidMove ? 'valid-drop-target' : 'invalid-drop-target');
        }
    }

    handleDragLeave(e) {
        const targetStack = e.target.closest('.card-stack');
        if (targetStack) {
            targetStack.classList.remove('valid-drop-target', 'invalid-drop-target');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggedCard || !this.dragSourceStackId) return;

        const targetStack = e.target.closest('.card-stack');
        if (!targetStack) return;

        const targetStackId = targetStack.id;
        
        // Don't allow dropping on the same stack
        if (targetStackId === this.dragSourceStackId) return;

        // Try to move the card - the moveCard function will check validity
        const success = this.moveCard(this.draggedCard, this.dragSourceStackId, targetStackId);

        // If the move was unsuccessful, return the card to its original position
        if (!success) {
            const sourceStack = document.getElementById(this.dragSourceStackId);
            if (sourceStack) {
                if (this.dragSourceStackId.startsWith('tableau-')) {
                    const tableauIndex = parseInt(this.dragSourceStackId.split('-')[1]);
                    this.updateTableauDisplay(tableauIndex);
                } else if (this.dragSourceStackId.startsWith('foundation-')) {
                    const foundationIndex = parseInt(this.dragSourceStackId.split('-')[1]);
                    this.updateFoundationDisplay(foundationIndex);
                } else if (this.dragSourceStackId === 'waste') {
                    this.updateWasteDisplay();
                }
            }
        }

        // Clear drag state and visual feedback
        this.draggedCard = null;
        this.dragSourceStackId = null;
        document.querySelectorAll('.card-stack').forEach(stack => {
            stack.classList.remove('valid-drop-target', 'invalid-drop-target');
        });
    }

    findCardFromElement(element) {
        // Search in waste pile
        if (this.waste.length > 0 && this.waste[this.waste.length - 1].element === element) {
            return this.waste[this.waste.length - 1];
        }

        // Search in tableaus
        for (let i = 0; i < this.tableaus.length; i++) {
            const card = this.tableaus[i].find(c => c.element === element);
            if (card) return card;
        }

        // Search in foundations
        for (let i = 0; i < this.foundations.length; i++) {
            const card = this.foundations[i].find(c => c.element === element);
            if (card) return card;
        }

        return null;
    }

    moveCard(card, sourceStackId, targetStackId) {
        // Moving to foundation
        if (targetStackId.startsWith('foundation-')) {
            const foundationIndex = parseInt(targetStackId.split('-')[1]);
            if (this.canMoveToFoundation(card, foundationIndex)) {
                this.moveToFoundation(card, sourceStackId, foundationIndex);
                this.checkWinCondition();
                return true;
            }
        }
        // Moving to tableau
        else if (targetStackId.startsWith('tableau-')) {
            const tableauIndex = parseInt(targetStackId.split('-')[1]);
            if (this.canMoveToTableau(card, tableauIndex)) {
                this.moveToTableau(card, sourceStackId, tableauIndex);
                return true;
            }
        }
        return false;
    }

    canMoveToFoundation(card, foundationIndex) {
        const foundation = this.foundations[foundationIndex];
        if (foundation.length === 0) {
            return card.rank === 'A';
        }
        const topCard = foundation[foundation.length - 1];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return card.suit === topCard.suit && 
               ranks.indexOf(card.rank) === ranks.indexOf(topCard.rank) + 1;
    }

    canMoveToTableau(card, tableauIndex) {
        const tableau = this.tableaus[tableauIndex];
        if (tableau.length === 0) {
            return card.rank === 'K';
        }
        const topCard = tableau[tableau.length - 1];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const isAlternatingColor = (
            (card.suit === '♥' || card.suit === '♦') !== 
            (topCard.suit === '♥' || topCard.suit === '♦')
        );
        return isAlternatingColor && 
               ranks.indexOf(card.rank) === ranks.indexOf(topCard.rank) - 1;
    }

    moveToFoundation(card, sourceStackId, foundationIndex) {
        // Remove from source
        if (sourceStackId === 'waste') {
            this.waste.pop();
            this.updateWasteDisplay();
        } else if (sourceStackId.startsWith('tableau-')) {
            const tableauIndex = parseInt(sourceStackId.split('-')[1]);
            const cardIndex = this.tableaus[tableauIndex].indexOf(card);
            if (cardIndex !== -1) {
                this.tableaus[tableauIndex].splice(cardIndex, 1);
                if (this.tableaus[tableauIndex].length > 0) {
                    const newTopCard = this.tableaus[tableauIndex][this.tableaus[tableauIndex].length - 1];
                    if (!newTopCard.faceUp) {
                        newTopCard.faceUp = true;
                        newTopCard.updateCardDisplay(newTopCard.element);
                    }
                }
                this.updateTableauDisplay(tableauIndex);
            }
        }

        // Add to foundation
        card.faceUp = true;
        card.updateCardDisplay(card.element);
        this.foundations[foundationIndex].push(card);
        this.updateFoundationDisplay(foundationIndex);
    }

    moveToTableau(card, sourceStackId, tableauIndex) {
        let cardsToMove = [];

        // Remove from source
        if (sourceStackId === 'waste') {
            this.waste.pop();
            cardsToMove.push(card);
            this.updateWasteDisplay();
        } else if (sourceStackId.startsWith('tableau-')) {
            const sourceIndex = parseInt(sourceStackId.split('-')[1]);
            const cardIndex = this.tableaus[sourceIndex].indexOf(card);
            if (cardIndex !== -1) {
                cardsToMove = this.tableaus[sourceIndex].splice(cardIndex);
                
                // Reveal the next card in the source tableau if it exists
                if (this.tableaus[sourceIndex].length > 0) {
                    const topCard = this.tableaus[sourceIndex][this.tableaus[sourceIndex].length - 1];
                    if (!topCard.faceUp) {
                        topCard.faceUp = true;
                        topCard.updateCardDisplay(topCard.element);
                    }
                }
                this.updateTableauDisplay(sourceIndex);
            }
        } else if (sourceStackId.startsWith('foundation-')) {
            const foundationIndex = parseInt(sourceStackId.split('-')[1]);
            const removedCard = this.foundations[foundationIndex].pop();
            if (removedCard) {
                cardsToMove.push(removedCard);
                this.updateFoundationDisplay(foundationIndex);
            }
        }

        // Add to tableau
        if (cardsToMove.length > 0) {
            this.tableaus[tableauIndex].push(...cardsToMove);
            this.updateTableauDisplay(tableauIndex);
        }
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Solitaire();
});
