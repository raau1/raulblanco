// Main Application Module

const App = {
    // Initialize the application
    init() {
        console.log('Initializing Study Buddy App...');

        // Initialize authentication
        Auth.init();

        // Set up navigation
        this.setupNavigation();

        // Set up form handlers
        this.setupForms();

        // Set up other event listeners
        this.setupEventListeners();

        // Set up modal listeners
        this.setupModalListeners();

        // Load initial page
        this.navigateTo('home');

        console.log('App initialized successfully');
    },

    // Set up navigation handlers
    setupNavigation() {
        // Handle all navigation clicks
        document.addEventListener('click', (e) => {
            const pageLink = e.target.closest('[data-page]');
            if (pageLink) {
                e.preventDefault();
                const page = pageLink.getAttribute('data-page');
                this.navigateTo(page);
            }
        });

        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking a link
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    navMenu.classList.remove('active');
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }
    },

    // Navigate to a page
    navigateTo(pageName) {
        // Clean up timers when leaving sessionView
        if (Sessions.timerInterval) {
            clearInterval(Sessions.timerInterval);
            Sessions.timerInterval = null;
        }

        // Check if page requires authentication
        const protectedPages = ['create', 'profile'];
        if (protectedPages.includes(pageName) && !Auth.isLoggedIn()) {
            this.showToast('Please login to access this page', 'error');
            pageName = 'login';
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });

        // Page-specific initialization
        this.onPageLoad(pageName);

        // Scroll to top
        window.scrollTo(0, 0);
    },

    // Handle page-specific initialization
    browseRefreshInterval: null,
    onPageLoad(pageName) {
        // Clear any refresh intervals from previous pages
        if (this.browseRefreshInterval) {
            clearInterval(this.browseRefreshInterval);
            this.browseRefreshInterval = null;
        }

        switch (pageName) {
            case 'browse':
                this.loadSessions();
                // Auto-refresh every 30 seconds to update timers and remove expired sessions
                this.browseRefreshInterval = setInterval(() => this.loadSessions(), 30000);
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'create':
                // Set default date to today
                const dateInput = document.getElementById('sessionDate');
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.min = today;
                    dateInput.value = today;
                }

                // Set up startNow toggle (remove old listeners by cloning)
                const startNowCheckbox = document.getElementById('startNow');
                const scheduleFields = document.getElementById('scheduleFields');
                if (startNowCheckbox && scheduleFields) {
                    // Clone to remove old event listeners
                    const newCheckbox = startNowCheckbox.cloneNode(true);
                    startNowCheckbox.parentNode.replaceChild(newCheckbox, startNowCheckbox);

                    newCheckbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            scheduleFields.style.display = 'none';
                        } else {
                            scheduleFields.style.display = 'block';
                        }
                    });
                    // Reset on page load
                    newCheckbox.checked = false;
                    scheduleFields.style.display = 'block';
                }
                break;
            case 'userProfile':
                this.loadUserProfileView();
                break;
        }
    },

    // Load user profile view page
    async loadUserProfileView() {
        if (!this.viewingUserId) {
            this.navigateTo('browse');
            return;
        }

        try {
            // Fetch user data, rating, and block status
            const [user, ratingData, blockStatus] = await Promise.all([
                API.get(`/users/${this.viewingUserId}`),
                API.get(`/users/${this.viewingUserId}/rating`),
                API.get(`/users/${this.viewingUserId}/block-status`)
            ]);

            // Update UI
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
            document.querySelector('#viewUserAvatar span').textContent = initials;
            document.getElementById('viewUserName').textContent = user.name;
            document.getElementById('viewUserYear').textContent = `Year ${user.year}`;

            // Update rating display
            const avgRating = ratingData.averageRating || 0;
            const ratingCount = ratingData.ratingCount || 0;
            const fullStars = Math.floor(avgRating);
            document.getElementById('viewUserStars').textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
            document.getElementById('viewUserRatingText').textContent = avgRating > 0
                ? `${avgRating.toFixed(1)} (${ratingCount} rating${ratingCount !== 1 ? 's' : ''})`
                : 'No ratings yet';

            // Update block button
            const blockBtn = document.getElementById('viewUserBlockBtn');
            if (blockBtn) {
                if (blockStatus.hasBlocked) {
                    blockBtn.textContent = 'Unblock User';
                    blockBtn.classList.remove('btn-danger');
                    blockBtn.classList.add('btn-secondary');
                } else {
                    blockBtn.textContent = 'Block User';
                    blockBtn.classList.remove('btn-secondary');
                    blockBtn.classList.add('btn-danger');
                }
                // Set up click handler
                this.setupViewUserBlockButton();
            }

            // Load sessions
            const sessionsContainer = document.getElementById('viewUserSessions');
            if (this.viewingUserSessions && this.viewingUserSessions.length > 0) {
                sessionsContainer.innerHTML = this.viewingUserSessions.map(session => Sessions.renderCard(session)).join('');
            } else {
                sessionsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No sessions created by this user</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading user profile view:', error);
            this.showToast('Failed to load user profile', 'error');
        }
    },

    // Set up form handlers
    setupForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const errorEl = document.getElementById('loginError');

                try {
                    errorEl.textContent = '';
                    await Auth.login(email, password);
                    loginForm.reset();
                } catch (error) {
                    errorEl.textContent = error.message;
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const year = document.getElementById('signupYear').value;
                const password = document.getElementById('signupPassword').value;
                const confirm = document.getElementById('signupConfirm').value;
                const errorEl = document.getElementById('signupError');

                // Validate passwords match
                if (password !== confirm) {
                    errorEl.textContent = 'Passwords do not match';
                    return;
                }

                try {
                    errorEl.textContent = '';
                    await Auth.signup(name, email, password, year);
                    signupForm.reset();
                } catch (error) {
                    errorEl.textContent = error.message;
                }
            });
        }

        // Create session form
        const createForm = document.getElementById('createSessionForm');
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get form data
                const formData = new FormData(createForm);

                // Get preferences checkboxes
                const preferences = [];
                document.querySelectorAll('input[name="preferences"]:checked').forEach(cb => {
                    preferences.push(cb.value);
                });

                // Check if starting now
                const startNow = document.getElementById('startNow').checked;

                // Validate date/time if not starting now
                if (!startNow) {
                    if (!formData.get('date') || !formData.get('time')) {
                        this.showToast('Please select date and time or check "Start Now"', 'error');
                        return;
                    }
                }

                const sessionData = {
                    title: formData.get('title'),
                    module: formData.get('module'),
                    year: formData.get('year'),
                    date: startNow ? null : formData.get('date'),
                    time: startNow ? null : formData.get('time'),
                    duration: parseInt(formData.get('duration')),
                    maxParticipants: parseInt(formData.get('maxParticipants')),
                    preferences: preferences.join(','),
                    description: formData.get('description'),
                    startNow: startNow
                };

                try {
                    await Sessions.create(sessionData);
                    this.showToast('Session created successfully!', 'success');
                    createForm.reset();
                    this.navigateTo('browse');
                } catch (error) {
                    this.showToast(error.message || 'Failed to create session', 'error');
                }
            });
        }
    },

    // Set up other event listeners
    setupEventListeners() {
        // Filter sessions
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.loadSessions());
        }

        // Join session buttons (delegated)
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('join-btn')) {
                const sessionId = e.target.getAttribute('data-session-id');
                await this.handleJoinSession(sessionId);
            }

            // View session buttons
            if (e.target.classList.contains('view-btn')) {
                const sessionId = e.target.getAttribute('data-session-id');
                await Sessions.viewSession(sessionId);
            }
        });

        // Profile tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // Load sessions into browse page
    async loadSessions() {
        const grid = document.getElementById('sessionsGrid');
        const noSessions = document.getElementById('noSessions');

        if (!grid) return;

        // Get filters
        const year = document.getElementById('filterYear')?.value || '';
        const module = document.getElementById('filterModule')?.value || '';

        try {
            const sessions = await Sessions.getAll({ year, module });

            if (sessions.length === 0) {
                grid.innerHTML = '';
                noSessions?.classList.remove('hidden');
            } else {
                noSessions?.classList.add('hidden');
                grid.innerHTML = sessions.map(session => Sessions.renderCard(session)).join('');
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showToast('Failed to load sessions', 'error');
        }
    },

    // Handle join session
    async handleJoinSession(sessionId) {
        if (!Auth.isLoggedIn()) {
            this.showToast('Please login to join a session', 'error');
            this.navigateTo('login');
            return;
        }

        try {
            await Sessions.requestJoin(sessionId);
            this.showToast('Join request sent! Waiting for host approval.', 'success');
            // Reload sessions to show updated status
            this.loadSessions();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // Load user profile
    async loadProfile() {
        if (!Auth.isLoggedIn()) return;

        try {
            // Get user data - fallback to Auth.currentUser if API fails
            let user = Auth.currentUser;
            let stats = { sessionsCreated: 0, sessionsJoined: 0, averageRating: 0, ratingCount: 0 };

            try {
                const [userData, userStats] = await Promise.all([
                    API.get('/users/me'),
                    API.get('/users/me/stats')
                ]);
                user = userData;
                stats = userStats;
            } catch (apiError) {
                console.warn('Could not fetch profile from API, using local data');
            }

            // Update profile UI
            const nameEl = document.getElementById('profileName');
            const yearEl = document.getElementById('profileYear');
            const emailEl = document.getElementById('profileEmail');
            const avatarEl = document.getElementById('profileAvatar');

            if (nameEl) nameEl.textContent = user.name || user.email || 'User';
            if (yearEl) yearEl.textContent = user.year ? `Year ${user.year}` : 'Year not set';
            if (emailEl) emailEl.textContent = user.email || '';
            if (avatarEl) {
                const name = user.name || user.email || 'U';
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                avatarEl.querySelector('span').textContent = initials;
            }

            // Update stats
            const statSessions = document.getElementById('statSessions');
            const statJoined = document.getElementById('statJoined');
            const statRating = document.getElementById('statRating');

            if (statSessions) statSessions.textContent = stats.sessionsCreated || 0;
            if (statJoined) statJoined.textContent = stats.sessionsJoined || 0;
            if (statRating) {
                statRating.textContent = stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : '-';
            }

            // Update rating stars and count
            const ratingStars = document.getElementById('profileStars');
            const ratingCountEl = document.getElementById('profileRatingCount');
            if (ratingStars) {
                if (stats.averageRating > 0) {
                    const fullStars = Math.floor(stats.averageRating);
                    ratingStars.textContent = '⭐'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
                } else {
                    ratingStars.textContent = '☆☆☆☆☆';
                }
            }
            if (ratingCountEl) {
                ratingCountEl.textContent = `(${stats.ratingCount || 0} ratings)`;
            }

            // Load user's sessions
            await this.loadProfileSessions();

            // Set up tab switching
            this.setupProfileTabs();

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    // Load sessions for profile page
    async loadProfileSessions() {
        try {
            const [created, joined] = await Promise.all([
                Sessions.getMySessions(),
                Sessions.getJoined()
            ]);

            // Filter created sessions to find those with pending requests
            const pending = created.filter(session =>
                session.joinRequests && session.joinRequests.length > 0
            );

            // Store for tab switching
            this.profileData = { created, joined, pending };

            // Show created sessions by default
            this.showProfileTab('created');
        } catch (error) {
            console.error('Error loading profile sessions:', error);
        }
    },

    // Show specific tab content
    showProfileTab(tabName) {
        const container = document.getElementById('profileSessions');
        if (!container) return;

        if (tabName === 'blocked') {
            // Special handling for blocked users tab
            this.renderBlockedUsersTab(container);
            return;
        }

        if (!this.profileData) return;

        let sessions = [];
        if (tabName === 'created') {
            sessions = this.profileData.created || [];
        } else if (tabName === 'joined') {
            sessions = this.profileData.joined || [];
        } else if (tabName === 'pending') {
            sessions = this.profileData.pending || [];
        }

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No ${tabName === 'pending' ? 'pending requests' : tabName + ' sessions'} yet</p>
                </div>
            `;
        } else if (tabName === 'pending') {
            // Special rendering for pending requests
            this.renderPendingRequestsTab(container, sessions);
        } else {
            container.innerHTML = sessions.map(session => Sessions.renderCard(session)).join('');
        }
    },

    // Render pending requests tab with session info and request list
    async renderPendingRequestsTab(container, sessions) {
        container.innerHTML = sessions.map(session => {
            const requestCount = session.joinRequests ? session.joinRequests.length : 0;
            return `
                <div class="pending-session-card" data-session-id="${session.id}">
                    <div class="pending-session-header">
                        <div>
                            <h4 class="pending-session-title">${session.title}</h4>
                            <span class="pending-session-module">${session.module}</span>
                        </div>
                        <span class="pending-count">${requestCount} pending</span>
                    </div>
                    <div class="pending-requests-list" id="pending-${session.id}">
                        <p class="loading-text">Loading requests...</p>
                    </div>
                </div>
            `;
        }).join('');

        // Load request details for each session
        for (const session of sessions) {
            const listContainer = document.getElementById(`pending-${session.id}`);
            if (listContainer && session.joinRequests) {
                await Sessions.renderPendingRequests(session.id, session.joinRequests, listContainer);
            }
        }
    },

    // Set up profile tab switching
    setupProfileTabs() {
        const tabBtns = document.querySelectorAll('.profile-section .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Show tab content
                const tabName = e.target.getAttribute('data-tab');
                this.showProfileTab(tabName);
            });
        });
    },

    // Render blocked users tab
    async renderBlockedUsersTab(container) {
        container.innerHTML = '<p class="loading-text">Loading blocked users...</p>';

        try {
            const blockedUsers = await API.get('/users/blocked/details');

            if (blockedUsers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No blocked users</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = blockedUsers.map(user => {
                const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
                return `
                    <div class="blocked-user-item">
                        <div class="blocked-user-info">
                            <div class="creator-avatar">${initials}</div>
                            <div>
                                <div class="blocked-user-name">${user.name}</div>
                                <div class="blocked-user-details">Year ${user.year} • ${user.email}</div>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm unblock-user-btn" data-user-id="${user.id}">
                            Unblock
                        </button>
                    </div>
                `;
            }).join('');

            // Set up unblock handlers
            container.querySelectorAll('.unblock-user-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = e.target.getAttribute('data-user-id');
                    await this.handleUnblockUser(userId);
                });
            });
        } catch (error) {
            console.error('Error loading blocked users:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Error loading blocked users</p>
                </div>
            `;
        }
    },

    // Handle unblocking a user
    async handleUnblockUser(userId) {
        try {
            await API.delete(`/users/${userId}/block`);
            this.showToast('User unblocked', 'success');
            // Refresh the blocked users tab
            const container = document.getElementById('profileSessions');
            await this.renderBlockedUsersTab(container);
        } catch (error) {
            console.error('Error unblocking user:', error);
            this.showToast('Failed to unblock user', 'error');
        }
    },

    // Set up block button on user profile view page
    setupViewUserBlockButton() {
        const blockBtn = document.getElementById('viewUserBlockBtn');
        if (!blockBtn || !this.viewingUserId) return;

        // Remove old listener by cloning
        const newBtn = blockBtn.cloneNode(true);
        blockBtn.parentNode.replaceChild(newBtn, blockBtn);

        newBtn.addEventListener('click', async () => {
            const isBlocked = newBtn.textContent === 'Unblock User';

            try {
                if (isBlocked) {
                    await API.delete(`/users/${this.viewingUserId}/block`);
                    this.showToast('User unblocked', 'success');
                    newBtn.textContent = 'Block User';
                    newBtn.classList.remove('btn-secondary');
                    newBtn.classList.add('btn-danger');
                } else {
                    await API.post(`/users/${this.viewingUserId}/block`);
                    this.showToast('User blocked', 'success');
                    newBtn.textContent = 'Unblock User';
                    newBtn.classList.remove('btn-danger');
                    newBtn.classList.add('btn-secondary');
                }
            } catch (error) {
                console.error('Error blocking/unblocking user:', error);
                this.showToast(error.message || 'Failed to update block status', 'error');
            }
        });
    },

    // User profile modal state
    currentProfileUserId: null,
    currentSessionIdForKick: null,
    isSessionOwner: false,
    selectedRating: 0,

    // Show user profile modal
    async showUserProfile(userId, sessionId = null) {
        if (!Auth.isLoggedIn()) {
            this.showToast('Please login to view profiles', 'error');
            return;
        }

        // Can't view your own profile in modal
        if (userId === Auth.currentUser?.id) {
            this.showToast('This is you!', 'info');
            return;
        }

        try {
            // Fetch user data, rating, and block status
            const [user, ratingData, myRating, blockStatus] = await Promise.all([
                API.get(`/users/${userId}`),
                API.get(`/users/${userId}/rating`),
                API.get(`/users/${userId}/my-rating`),
                API.get(`/users/${userId}/block-status`)
            ]);

            this.currentProfileUserId = userId;
            this.currentSessionIdForKick = sessionId;

            // Check if current user is the session owner
            const kickBtn = document.getElementById('kickUserBtn');
            if (kickBtn && sessionId) {
                try {
                    const session = await Sessions.getById(sessionId);
                    this.isSessionOwner = session.creatorId === Auth.currentUser?.id;
                    // Show kick button only if user is session owner and target is a participant
                    if (this.isSessionOwner && session.participants && session.participants.includes(userId)) {
                        kickBtn.style.display = 'block';
                    } else {
                        kickBtn.style.display = 'none';
                    }
                } catch (err) {
                    kickBtn.style.display = 'none';
                }
            } else if (kickBtn) {
                kickBtn.style.display = 'none';
            }

            // Update modal UI
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
            document.querySelector('#modalUserAvatar span').textContent = initials;
            document.getElementById('modalUserName').textContent = user.name;
            document.getElementById('modalUserEmail').textContent = user.email;
            document.getElementById('modalUserYear').textContent = `Year ${user.year}`;

            // Update rating display
            const avgRating = ratingData.averageRating || 0;
            const ratingCount = ratingData.ratingCount || 0;
            const fullStars = Math.floor(avgRating);
            document.getElementById('modalUserStars').textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
            document.getElementById('modalUserRating').textContent = avgRating > 0
                ? `${avgRating.toFixed(1)} (${ratingCount} rating${ratingCount !== 1 ? 's' : ''})`
                : 'No ratings yet';

            // Set current user's rating if they've rated before
            this.selectedRating = myRating.hasRated ? myRating.score : 0;
            this.updateStarDisplay();

            // Update block button state
            const blockBtn = document.getElementById('blockUserBtn');
            if (blockBtn) {
                if (blockStatus.hasBlocked) {
                    blockBtn.textContent = 'Unblock User';
                    blockBtn.classList.remove('btn-danger');
                    blockBtn.classList.add('btn-secondary');
                } else {
                    blockBtn.textContent = 'Block User';
                    blockBtn.classList.remove('btn-secondary');
                    blockBtn.classList.add('btn-danger');
                }
            }

            // Show modal
            document.getElementById('userProfileModal').classList.add('active');
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showToast('Failed to load user profile', 'error');
        }
    },

    // Close user profile modal
    closeUserProfile() {
        document.getElementById('userProfileModal').classList.remove('active');
        this.currentProfileUserId = null;
        this.selectedRating = 0;
    },

    // Update star display in modal
    updateStarDisplay() {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach((star, index) => {
            if (index < this.selectedRating) {
                star.textContent = '★';
                star.classList.add('active');
            } else {
                star.textContent = '☆';
                star.classList.remove('active');
            }
        });
    },

    // Set up modal event listeners
    setupModalListeners() {
        // Close modal button
        document.getElementById('closeUserModal')?.addEventListener('click', () => {
            this.closeUserProfile();
        });

        // Close on overlay click
        document.getElementById('userProfileModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'userProfileModal') {
                this.closeUserProfile();
            }
        });

        // Star rating hover and click
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.getAttribute('data-value'));
                stars.forEach((s, i) => {
                    if (i < value) {
                        s.textContent = '★';
                        s.classList.add('hovered');
                    } else {
                        s.textContent = '☆';
                        s.classList.remove('hovered');
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
                this.updateStarDisplay();
            });

            star.addEventListener('click', () => {
                this.selectedRating = parseInt(star.getAttribute('data-value'));
                this.updateStarDisplay();
            });
        });

        // Submit rating
        document.getElementById('submitRating')?.addEventListener('click', async () => {
            if (!this.currentProfileUserId) return;

            if (this.selectedRating === 0) {
                this.showToast('Please select a rating', 'error');
                return;
            }

            try {
                await API.post(`/users/${this.currentProfileUserId}/rate`, {
                    score: this.selectedRating
                });
                this.showToast('Rating submitted!', 'success');
                // Refresh the modal to show updated rating
                await this.showUserProfile(this.currentProfileUserId);
            } catch (error) {
                console.error('Error submitting rating:', error);
                this.showToast('Failed to submit rating', 'error');
            }
        });

        // View full profile button
        document.getElementById('viewFullProfile')?.addEventListener('click', async () => {
            if (!this.currentProfileUserId) return;

            try {
                // Fetch user's sessions
                const sessions = await API.get('/sessions');
                const userSessions = sessions.filter(s => s.creatorId === this.currentProfileUserId);

                // Store the user ID for the profile view
                this.viewingUserId = this.currentProfileUserId;
                this.viewingUserSessions = userSessions;

                // Close modal and navigate to user profile view
                this.closeUserProfile();
                this.navigateTo('userProfile');
            } catch (error) {
                console.error('Error loading user sessions:', error);
                this.showToast('Failed to load user profile', 'error');
            }
        });

        // Block/Unblock user button
        document.getElementById('blockUserBtn')?.addEventListener('click', async () => {
            if (!this.currentProfileUserId) return;

            const btn = document.getElementById('blockUserBtn');
            const isBlocked = btn.textContent === 'Unblock User';

            try {
                if (isBlocked) {
                    await API.delete(`/users/${this.currentProfileUserId}/block`);
                    this.showToast('User unblocked', 'success');
                    btn.textContent = 'Block User';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-danger');
                } else {
                    await API.post(`/users/${this.currentProfileUserId}/block`);
                    this.showToast('User blocked', 'success');
                    btn.textContent = 'Unblock User';
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                }
                // Refresh chat if viewing a session
                if (typeof Chat !== 'undefined' && Chat.currentSessionId) {
                    Chat.loadMessages();
                }
            } catch (error) {
                console.error('Error blocking/unblocking user:', error);
                this.showToast(error.message || 'Failed to update block status', 'error');
            }
        });

        // Kick user button
        document.getElementById('kickUserBtn')?.addEventListener('click', async () => {
            if (!this.currentProfileUserId || !this.currentSessionIdForKick) return;

            try {
                await Sessions.kick(this.currentSessionIdForKick, this.currentProfileUserId);
                this.showToast('User kicked from session', 'success');
                this.closeUserProfile();

                // Refresh the session view to update participant list
                if (typeof Sessions !== 'undefined' && Sessions.currentSession) {
                    await Sessions.viewSession(this.currentSessionIdForKick);
                }
            } catch (error) {
                console.error('Error kicking user:', error);
                this.showToast(error.message || 'Failed to kick user', 'error');
            }
        });
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;

        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use in other files
window.App = App;
