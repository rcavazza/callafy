// Sidebar Component - Mobile sidebar functionality

class SidebarComponent {
    constructor() {
        this.isOpen = false;
        this.overlay = null;
        this.sidebar = null;
        this.init();
    }

    init() {
        this.overlay = document.getElementById('mobile-sidebar-overlay');
        this.sidebar = document.getElementById('mobile-sidebar');
        
        if (!this.overlay || !this.sidebar) {
            console.warn('Mobile sidebar elements not found');
            return;
        }

        this.bindEvents();
        this.updateState();
    }

    bindEvents() {
        // Listen for state changes
        if (window.state) {
            state.subscribe('sidebarOpen', (isOpen) => {
                this.isOpen = isOpen;
                this.updateUI();
            });
        }

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        if (window.state) {
            state.set('sidebarOpen', true);
        }
        this.updateUI();
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        if (window.state) {
            state.set('sidebarOpen', false);
        }
        this.updateUI();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    updateUI() {
        if (!this.overlay || !this.sidebar) return;

        if (this.isOpen) {
            this.overlay.style.display = 'flex';
            this.sidebar.classList.remove('-translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
            this.overlay.style.display = 'none';
            this.sidebar.classList.add('-translate-x-full');
            document.body.style.overflow = '';
        }
    }

    updateState() {
        if (window.state) {
            this.isOpen = state.get('sidebarOpen') || false;
        }
        this.updateUI();
    }
}

// Create and export singleton
const sidebar = new SidebarComponent();

// Export to global scope
window.sidebar = sidebar;

// Global functions for onclick handlers
window.openMobileSidebar = () => sidebar.open();
window.closeMobileSidebar = () => sidebar.close();
window.toggleMobileSidebar = () => sidebar.toggle();