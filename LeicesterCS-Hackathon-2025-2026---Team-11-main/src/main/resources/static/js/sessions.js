// Sessions Module - Handles all session-related operations

const Sessions = {
    // Create a new study session
    async create(sessionData) {
        try {
            const response = await API.post('/sessions', sessionData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get all sessions with optional filters
    async getAll(filters = {}) {
        try {
            let endpoint = '/sessions';
            const params = new URLSearchParams();

            if (filters.year) {
                params.append('year', filters.year);
            }
            if (filters.module) {
                params.append('module', filters.module);
            }

            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }

            return await API.get(endpoint);
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    },

    // Get a single session by ID
    async getById(sessionId) {
        try {
            return await API.get(`/sessions/${sessionId}`);
        } catch (error) {
            throw error;
        }
    },

    // Get sessions created by current user
    async getMySessions() {
        try {
            return await API.get('/sessions/my-sessions');
        } catch (error) {
            console.error('Error getting my sessions:', error);
            return [];
        }
    },

    // Get sessions user has joined
    async getJoined() {
        try {
            return await API.get('/sessions/joined');
        } catch (error) {
            console.error('Error getting joined sessions:', error);
            return [];
        }
    },

    // Request to join a session
    async requestJoin(sessionId) {
        try {
            return await API.post(`/sessions/${sessionId}/request`, {});
        } catch (error) {
            throw error;
        }
    },

    // Accept a join request
    async acceptRequest(sessionId, userId) {
        try {
            return await API.post(`/sessions/${sessionId}/accept/${userId}`, {});
        } catch (error) {
            throw error;
        }
    },

    // Decline a join request
    async declineRequest(sessionId, userId) {
        try {
            return await API.post(`/sessions/${sessionId}/decline/${userId}`, {});
        } catch (error) {
            throw error;
        }
    },

    // Delete a session
    async delete(sessionId) {
        try {
            return await API.delete(`/sessions/${sessionId}`);
        } catch (error) {
            throw error;
        }
    },

    // Kick a participant from a session
    async kick(sessionId, userId) {
        try {
            return await API.post(`/sessions/${sessionId}/kick/${userId}`, {});
        } catch (error) {
            throw error;
        }
    },

    // Calculate time remaining for a session
    getTimeRemaining(session) {
        if (!session.date || !session.time || !session.duration) return null;

        const [year, month, day] = session.date.split('-').map(Number);
        const [hours, minutes] = session.time.split(':').map(Number);

        const sessionStart = new Date(year, month - 1, day, hours, minutes);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
        const now = new Date();

        // Always show countdown, never mark as expired
        if (now < sessionStart) return 'Not started';

        const msRemaining = sessionEnd - now;
        const minutesRemaining = Math.floor(msRemaining / 60000);
        const hoursRemaining = Math.floor(minutesRemaining / 60);
        const minsRemaining = minutesRemaining % 60;

        // Show countdown even if time has passed
        if (hoursRemaining > 0) {
            return `${hoursRemaining}h ${minsRemaining}m left`;
        } else if (minutesRemaining > 0) {
            return `${minutesRemaining}m left`;
        } else {
            return `In progress`;
        }
    },

    // Render pending join requests
    async renderPendingRequests(sessionId, requestUserIds, container) {
        if (!requestUserIds || requestUserIds.length === 0) {
            container.innerHTML = '<p>No pending requests</p>';
            return;
        }

        try {
            // Fetch user details and ratings for each request
            const userPromises = requestUserIds.map(async userId => {
                try {
                    const [user, rating] = await Promise.all([
                        API.get(`/users/${userId}`),
                        API.get(`/users/${userId}/rating`)
                    ]);
                    return { ...user, rating: rating.averageRating, ratingCount: rating.ratingCount };
                } catch (error) {
                    console.error(`Failed to fetch user ${userId}:`, error);
                    return null;
                }
            });
            const users = (await Promise.all(userPromises)).filter(user => user !== null);

            if (users.length === 0) {
                container.innerHTML = '<p>No valid pending requests</p>';
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="request-item">
                    <div class="request-user-info">
                        <div class="creator-avatar">${user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                        <div>
                            <div class="request-user-name">${user.name}</div>
                            <div class="request-user-details">Year ${user.year} • ${user.rating > 0 ? `⭐ ${user.rating.toFixed(1)}` : 'No ratings'}</div>
                        </div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary btn-sm accept-request-btn"
                                data-session-id="${sessionId}"
                                data-user-id="${user.id}">
                            Accept
                        </button>
                        <button class="btn btn-secondary btn-sm decline-request-btn"
                                data-session-id="${sessionId}"
                                data-user-id="${user.id}">
                            Decline
                        </button>
                    </div>
                </div>
            `).join('');

            // Set up event handlers for accept/decline buttons
            this.setupRequestHandlers();
        } catch (error) {
            console.error('Error rendering requests:', error);
            container.innerHTML = '<p>Error loading requests</p>';
        }
    },

    // Set up handlers for accept/decline buttons
    setupRequestHandlers() {
        document.querySelectorAll('.accept-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sessionId = e.target.getAttribute('data-session-id');
                const userId = e.target.getAttribute('data-user-id');
                await this.handleAcceptRequest(sessionId, userId);
            });
        });

        document.querySelectorAll('.decline-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const sessionId = e.target.getAttribute('data-session-id');
                const userId = e.target.getAttribute('data-user-id');
                await this.handleDeclineRequest(sessionId, userId);
            });
        });
    },

    // Handle accepting a request
    async handleAcceptRequest(sessionId, userId) {
        try {
            await this.acceptRequest(sessionId, userId);
            App.showToast('Request accepted!', 'success');
            // Check if we're on profile page or session view
            const profilePage = document.getElementById('profilePage');
            if (profilePage && profilePage.classList.contains('active')) {
                // Reload profile sessions to update pending tab
                await App.loadProfileSessions();
                // Switch to pending tab to show updated list
                App.showProfileTab('pending');
            } else {
                // Reload session to update UI
                await this.viewSession(sessionId);
            }
        } catch (error) {
            App.showToast('Failed to accept request', 'error');
        }
    },

    // Handle declining a request
    async handleDeclineRequest(sessionId, userId) {
        try {
            await this.declineRequest(sessionId, userId);
            App.showToast('Request declined', 'info');
            // Check if we're on profile page or session view
            const profilePage = document.getElementById('profilePage');
            if (profilePage && profilePage.classList.contains('active')) {
                // Reload profile sessions to update pending tab
                await App.loadProfileSessions();
                // Switch to pending tab to show updated list
                App.showProfileTab('pending');
            } else {
                // Reload session to update UI
                await this.viewSession(sessionId);
            }
        } catch (error) {
            App.showToast('Failed to decline request', 'error');
        }
    },

    // Start a live countdown timer for a session
    timerInterval: null,
    startSessionTimer(session, element) {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const updateTimer = () => {
            const timeRemaining = this.getTimeRemaining(session);
            element.textContent = timeRemaining;
        };

        // Update immediately and then every second
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    },

    // Render session card HTML
    renderCard(session) {
        const dateObj = session.date ? new Date(session.date) : new Date();
        const formattedDate = dateObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        // Format time to HH:MM (remove seconds)
        const formattedTime = session.time ? session.time.substring(0, 5) : '';

        const preferences = session.preferences || [];
        const preferenceTags = preferences.map(pref =>
            `<span class="preference-tag">${pref}</span>`
        ).join('');

        const spotsLeft = session.spotsLeft || (session.maxParticipants - (session.participantCount || 1));
        const initials = session.creatorName ?
            session.creatorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

        // Check if session is live, scheduled, and get time remaining
        const isLive = session.isLive;
        const isScheduled = session.isScheduled;
        const timeRemaining = isLive ? this.getTimeRemaining(session) : null;

        // Format scheduled start time
        let scheduledInfo = '';
        if (isScheduled && session.scheduledStartTime) {
            const scheduledDate = new Date(session.scheduledStartTime);
            const now = new Date();
            const diffMs = scheduledDate - now;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) {
                scheduledInfo = `Starts in ${diffDays}d ${diffHours % 24}h`;
            } else if (diffHours > 0) {
                scheduledInfo = `Starts in ${diffHours}h ${diffMins % 60}m`;
            } else if (diffMins > 0) {
                scheduledInfo = `Starts in ${diffMins}m`;
            } else {
                scheduledInfo = 'Starting soon';
            }
        }

        // Check if current user is participant, creator, or has pending request
        const currentUserId = Auth.currentUser?.id;
        const isParticipant = session.participants && session.participants.includes(currentUserId);
        const isCreator = session.creatorId === currentUserId;
        const hasPendingRequest = session.joinRequests && session.joinRequests.includes(currentUserId);
        // Don't show join button for scheduled sessions that haven't started
        const showJoinButton = !isParticipant && !isCreator && !hasPendingRequest && !isScheduled;

        return `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <div>
                        <h3 class="session-title">${session.title}</h3>
                        <span class="session-module">${session.module}</span>
                    </div>
                    <div class="session-badges">
                        ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                        ${isScheduled ? '<span class="scheduled-badge">SCHEDULED</span>' : ''}
                        <span class="session-status ${session.status}">${session.status}</span>
                    </div>
                </div>

                <div class="session-details">
                    <div class="session-detail">
                        <span class="session-detail-icon">📅</span>
                        ${isLive ? 'Started ' : ''}${formattedDate} at ${formattedTime}
                    </div>
                    <div class="session-detail">
                        <span class="session-detail-icon">⏱️</span>
                        ${isScheduled ? `<strong class="scheduled-countdown">${scheduledInfo}</strong>` :
                          isLive && timeRemaining ? `<strong>${timeRemaining}</strong>` : `${session.duration} minutes`}
                    </div>
                    <div class="session-detail">
                        <span class="session-detail-icon">👥</span>
                        ${spotsLeft} spots left
                    </div>
                    <div class="session-detail">
                        <span class="session-detail-icon">🎓</span>
                        Year ${session.year}
                    </div>
                </div>

                ${preferenceTags ? `<div class="session-preferences">${preferenceTags}</div>` : ''}

                <div class="session-footer">
                    <div class="session-creator">
                        <div class="creator-avatar">${initials}</div>
                        <div>
                            <div class="creator-name">${session.creatorName}</div>
                            <div class="creator-rating">${session.creatorRating > 0 ? `⭐ ${session.creatorRating.toFixed(1)}` : 'No ratings'}</div>
                        </div>
                    </div>
                    <div class="session-actions">
                        <button class="btn btn-secondary btn-sm view-btn" data-session-id="${session.id}">
                            View
                        </button>
                        ${showJoinButton ? `
                            <button class="btn btn-primary btn-sm join-btn" data-session-id="${session.id}">
                                Join
                            </button>
                        ` : isScheduled ? `
                            <span class="btn btn-locked btn-sm" style="cursor: default;">🔒 Locked</span>
                        ` : hasPendingRequest ? `
                            <span class="btn btn-warning btn-sm" style="cursor: default;">Requested</span>
                        ` : (isParticipant || isCreator) ? `
                            <span class="btn btn-success btn-sm" style="cursor: default;">Joined</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // View session details with chat
    async viewSession(sessionId) {
        try {
            const session = await this.getById(sessionId);

            // Populate session details
            document.getElementById('viewSessionTitle').textContent = session.title;
            document.getElementById('viewSessionModule').textContent = session.module;

            const dateObj = session.date ? new Date(session.date) : new Date();
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const formattedTime = session.time ? session.time.substring(0, 5) : '';
            document.getElementById('viewSessionDateTime').textContent = `${formattedDate} at ${formattedTime}`;

            // Set up duration display (with timer for live sessions)
            const durationEl = document.getElementById('viewSessionDuration');
            if (session.isLive) {
                // Start live countdown timer
                this.startSessionTimer(session, durationEl);
            } else {
                durationEl.textContent = `${session.duration} minutes`;
            }

            document.getElementById('viewSessionParticipants').textContent =
                `${session.participantCount}/${session.maxParticipants}`;
            document.getElementById('viewSessionHost').textContent = session.creatorName;

            // Show LIVE or SCHEDULED badge
            const liveEl = document.getElementById('viewSessionLive');
            if (session.isLive) {
                liveEl.classList.remove('hidden');
                liveEl.textContent = 'LIVE';
                liveEl.className = 'live-badge';
            } else if (session.isScheduled) {
                liveEl.classList.remove('hidden');
                liveEl.textContent = 'SCHEDULED';
                liveEl.className = 'scheduled-badge';
            } else {
                liveEl.classList.add('hidden');
            }

            // Description
            const descEl = document.getElementById('viewSessionDescription');
            if (session.description) {
                descEl.innerHTML = `<p>${session.description}</p>`;
            } else {
                descEl.innerHTML = '';
            }

            // Preferences
            const prefsEl = document.getElementById('viewSessionPreferences');
            if (session.preferences && session.preferences.length > 0) {
                prefsEl.innerHTML = session.preferences.map(pref =>
                    `<span class="preference-tag">${pref}</span>`
                ).join('');
            } else {
                prefsEl.innerHTML = '';
            }

            // Show pending requests if user is the creator
            const currentUserId = Auth.currentUser?.id;
            const isCreator = session.creatorId === currentUserId;
            const pendingSection = document.getElementById('pendingRequestsSection');
            const pendingList = document.getElementById('pendingRequestsList');

            if (isCreator && session.joinRequests && session.joinRequests.length > 0) {
                pendingSection.classList.remove('hidden');
                await this.renderPendingRequests(sessionId, session.joinRequests, pendingList);
            } else {
                pendingSection.classList.add('hidden');
                pendingList.innerHTML = '';
            }

            // Check if user is a participant or creator to show/hide chat
            const isParticipant = session.participants && session.participants.includes(currentUserId);
            const chatPanel = document.getElementById('chatPanel');

            // Check if session is scheduled
            if (session.isScheduled) {
                const scheduledDate = new Date(session.scheduledStartTime);
                const formattedScheduledTime = scheduledDate.toLocaleString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                chatPanel.innerHTML = `
                    <div class="chat-locked scheduled">
                        <div class="lock-icon">🔒</div>
                        <h4>Session Not Yet Started</h4>
                        <p>This session is scheduled to start on:</p>
                        <p class="scheduled-time">${formattedScheduledTime}</p>
                        <p class="scheduled-note">Chat and participation will be available once the session starts.</p>
                    </div>
                `;
                chatPanel.style.display = 'flex';
            } else if (isParticipant || isCreator) {
                chatPanel.style.display = 'flex';
                // Initialize chat
                Chat.init(sessionId);

                // Render participants list
                await this.renderParticipantsList(session.participants, currentUserId);
            } else {
                chatPanel.innerHTML = `
                    <div class="chat-locked">
                        <p>Join this session to access the chat room</p>
                    </div>
                `;
                chatPanel.style.display = 'flex';
            }

            // Navigate to session view page
            App.navigateTo('sessionView');

            return session;
        } catch (error) {
            console.error('Error viewing session:', error);
            App.showToast('Failed to load session details', 'error');
            throw error;
        }
    },

    // Render participants list in chat panel
    async renderParticipantsList(participantIds, currentUserId) {
        const listContainer = document.getElementById('participantsList');
        const countEl = document.getElementById('participantCount');

        if (!listContainer || !participantIds) return;

        countEl.textContent = participantIds.length;

        // Fetch user info for all participants
        const participantPromises = participantIds.map(async userId => {
            try {
                const user = await API.get(`/users/${userId}`);
                return { ...user, id: userId };
            } catch (error) {
                return { id: userId, name: 'Unknown User' };
            }
        });

        const participants = await Promise.all(participantPromises);

        listContainer.innerHTML = participants.map(user => {
            const isYou = user.id === currentUserId;
            const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

            return `
                <div class="participant-chip ${isYou ? 'is-you' : ''}" data-user-id="${user.id}">
                    <div class="chip-avatar">${initials}</div>
                    <span>${user.name}${isYou ? ' (You)' : ''}</span>
                </div>
            `;
        }).join('');

        // Add click handlers for non-you participants
        listContainer.querySelectorAll('.participant-chip:not(.is-you)').forEach(chip => {
            chip.addEventListener('click', () => {
                const userId = chip.getAttribute('data-user-id');
                App.showUserProfile(userId, Chat.currentSessionId);
            });
        });
    }
};

// Export for use in other files
window.Sessions = Sessions;
