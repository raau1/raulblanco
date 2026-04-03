// Chat Module - Handles session chat functionality

const Chat = {
    currentSessionId: null,
    messages: [],
    pollInterval: null,
    lastTimestamp: 0,

    // Initialize chat for a session
    async init(sessionId) {
        // Clean up any existing chat first
        this.cleanup();

        this.currentSessionId = sessionId;
        this.messages = [];
        this.lastTimestamp = 0;

        // Set up form handler - remove any existing handler first
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            // Remove old handler by replacing with clone
            const newForm = chatForm.cloneNode(true);
            chatForm.parentNode.replaceChild(newForm, chatForm);

            // Use addEventListener instead of onsubmit for better control
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSendMessage(e);
            });
        }

        // Set up code editor handlers
        this.setupCodeEditor();

        // Load existing messages
        await this.loadMessages();

        // Start polling for new messages
        this.startPolling();
    },

    // Load all messages for the session
    async loadMessages() {
        try {
            const messages = await API.get(`/sessions/${this.currentSessionId}/chat`);
            this.messages = messages;

            if (messages.length > 0) {
                this.lastTimestamp = messages[messages.length - 1].timestamp;
            }

            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            this.updateStatus('Error loading messages');
        }
    },

    // Send a new message
    async handleSendMessage(e) {
        e.preventDefault();

        const input = document.getElementById('chatInput');
        const content = input.value.trim();

        if (!content) return;

        // Check if user typed /code
        if (content === '/code') {
            this.openCodeEditor();
            input.value = '';
            return;
        }

        try {
            const message = await API.post(`/sessions/${this.currentSessionId}/chat`, {
                content: content
            });

            // Add message to local array
            this.messages.push(message);
            this.lastTimestamp = message.timestamp;

            // Clear input and render
            input.value = '';
            this.renderMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            App.showToast('Failed to send message', 'error');
        }
    },

    // Poll for new messages
    startPolling() {
        // Clear any existing interval
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        // Poll every 3 seconds
        this.pollInterval = setInterval(async () => {
            await this.checkNewMessages();
        }, 3000);
    },

    // Stop polling
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    },

    // Check for new messages since last timestamp
    async checkNewMessages() {
        if (!this.currentSessionId) return;

        try {
            const newMessages = await API.get(
                `/sessions/${this.currentSessionId}/chat?since=${this.lastTimestamp}`
            );

            if (newMessages.length > 0) {
                // Add new messages to array
                this.messages.push(...newMessages);
                this.lastTimestamp = newMessages[newMessages.length - 1].timestamp;

                // Re-render and scroll
                this.renderMessages();
                this.scrollToBottom();
            }

            this.updateStatus('Connected');
        } catch (error) {
            console.error('Error checking messages:', error);
            this.updateStatus('Connection error');
        }
    },

    // Render all messages
    renderMessages() {
        const container = document.getElementById('chatMessages');
        const currentUserId = Auth.currentUser?.id;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => {
            const isOwn = msg.senderId === currentUserId;
            const time = this.formatTime(msg.timestamp);
            const messageContent = this.formatMessageContent(msg.content);

            return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="message-header">
                        ${isOwn ?
                            `<span class="message-sender">You</span>` :
                            `<span class="message-sender clickable" data-user-id="${msg.senderId}">${msg.senderName}</span>`
                        }
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">${messageContent}</div>
                </div>
            `;
        }).join('');

        // Add click handlers for clickable usernames
        container.querySelectorAll('.message-sender.clickable').forEach(el => {
            el.addEventListener('click', () => {
                const userId = el.getAttribute('data-user-id');
                App.showUserProfile(userId, this.currentSessionId);
            });
        });
    },

    // Scroll chat to bottom
    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    },

    // Update connection status
    updateStatus(status) {
        const statusEl = document.getElementById('chatStatus');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = 'chat-status ' + (status === 'Connected' ? 'connected' : 'error');
        }
    },

    // Format timestamp to readable time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Format message content with support for code blocks
    formatMessageContent(content) {
        // Check for /code prefix
        if (content.startsWith('/code ')) {
            const codeContent = content.substring(6); // Remove '/code ' prefix
            return `<pre class="code-block"><code>${this.escapeHtml(codeContent)}</code></pre>`;
        }

        // Check for markdown-style code blocks with triple backticks
        if (content.includes('```')) {
            // Split by code blocks and process each part
            const parts = [];
            let remaining = content;
            const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/;

            while (remaining.includes('```')) {
                const match = remaining.match(codeBlockRegex);
                if (!match) break;

                // Add text before code block (escaped)
                const beforeCode = remaining.substring(0, match.index);
                if (beforeCode) {
                    parts.push(this.escapeHtml(beforeCode));
                }

                // Add code block
                const language = match[1] || '';
                const code = match[2];
                const languageLabel = language ? `<span class="code-language">${this.escapeHtml(language)}</span>` : '';
                parts.push(`<pre class="code-block">${languageLabel}<code>${this.escapeHtml(code)}</code></pre>`);

                // Continue with remaining text
                remaining = remaining.substring(match.index + match[0].length);
            }

            // Add any remaining text
            if (remaining) {
                parts.push(this.escapeHtml(remaining));
            }

            return parts.join('');
        }

        // Check for inline code with single backticks
        if (content.includes('`') && !content.startsWith('`')) {
            let result = '';
            let remaining = content;
            const inlineCodeRegex = /`([^`\n]+)`/;

            while (remaining.includes('`')) {
                const match = remaining.match(inlineCodeRegex);
                if (!match) {
                    result += this.escapeHtml(remaining);
                    break;
                }

                // Add text before inline code
                result += this.escapeHtml(remaining.substring(0, match.index));

                // Add inline code
                result += `<code class="inline-code">${this.escapeHtml(match[1])}</code>`;

                // Continue with remaining text
                remaining = remaining.substring(match.index + match[0].length);
            }

            if (remaining && !remaining.includes('`')) {
                result += this.escapeHtml(remaining);
            }

            return result;
        }

        // Regular message - just escape HTML
        return this.escapeHtml(content);
    },

    // Set up code editor handlers
    setupCodeEditor() {
        const codeEditorContainer = document.getElementById('codeEditorContainer');
        const codeEditorInput = document.getElementById('codeEditorInput');
        const codeLanguageInput = document.getElementById('codeLanguage');
        const sendCodeBtn = document.getElementById('sendCodeBlock');
        const cancelCodeBtn = document.getElementById('cancelCodeEditor');
        const closeCodeBtn = document.getElementById('closeCodeEditor');

        if (!codeEditorContainer) return;

        // Handle Tab key in code editor
        codeEditorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const value = e.target.value;

                // Insert tab character
                e.target.value = value.substring(0, start) + '\t' + value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + 1;
            }

            // Send with Ctrl+Enter
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.sendCodeBlock();
            }
        });

        // Send code block button
        sendCodeBtn.addEventListener('click', () => {
            this.sendCodeBlock();
        });

        // Cancel button
        cancelCodeBtn.addEventListener('click', () => {
            this.closeCodeEditor();
        });

        // Close button
        closeCodeBtn.addEventListener('click', () => {
            this.closeCodeEditor();
        });
    },

    // Open code editor
    openCodeEditor() {
        const container = document.getElementById('codeEditorContainer');
        const chatForm = document.getElementById('chatForm');
        const codeInput = document.getElementById('codeEditorInput');
        const langInput = document.getElementById('codeLanguage');

        if (!container || !chatForm) return;

        // Hide chat form and show code editor
        chatForm.classList.add('hidden');
        container.classList.remove('hidden');

        // Clear previous values
        codeInput.value = '';
        langInput.value = '';

        // Focus on the code input
        codeInput.focus();
    },

    // Close code editor
    closeCodeEditor() {
        const container = document.getElementById('codeEditorContainer');
        const chatForm = document.getElementById('chatForm');

        if (!container || !chatForm) return;

        // Show chat form and hide code editor
        container.classList.add('hidden');
        chatForm.classList.remove('hidden');

        // Focus back on regular input
        document.getElementById('chatInput').focus();
    },

    // Send code block
    async sendCodeBlock() {
        const codeInput = document.getElementById('codeEditorInput');
        const langInput = document.getElementById('codeLanguage');
        const code = codeInput.value.trim();

        if (!code) {
            App.showToast('Code block is empty', 'error');
            return;
        }

        const language = langInput.value.trim();
        let content;

        if (language) {
            // Use markdown format with language
            content = '```' + language + '\n' + code + '\n```';
        } else {
            // Use markdown format without language
            content = '```\n' + code + '\n```';
        }

        try {
            const message = await API.post(`/sessions/${this.currentSessionId}/chat`, {
                content: content
            });

            // Add message to local array
            this.messages.push(message);
            this.lastTimestamp = message.timestamp;

            // Clear and close code editor
            this.closeCodeEditor();
            this.renderMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error sending code block:', error);
            App.showToast('Failed to send code block', 'error');
        }
    },

    // Clean up when leaving chat
    cleanup() {
        this.stopPolling();
        this.currentSessionId = null;
        this.messages = [];
        this.lastTimestamp = 0;
    }
};

// Export for use in other files
window.Chat = Chat;
