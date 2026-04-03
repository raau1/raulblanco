// Authentication Module - Firebase Auth

const Auth = {
    // Current user state
    currentUser: null,
    firebaseUser: null,

    // Initialize auth
    init() {
        // Listen for Firebase auth state changes
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                this.firebaseUser = user;
                // Get ID token for API calls
                const token = await user.getIdToken();
                API.setToken(token);

                // Fetch user profile from backend
                try {
                    const profile = await API.get('/users/me');
                    this.currentUser = profile;
                    this.updateUI(profile);
                } catch (error) {
                    // User exists in Firebase but not in Firestore yet
                    this.currentUser = {
                        id: user.uid,
                        name: user.displayName || user.email,
                        email: user.email
                    };
                    this.updateUI(this.currentUser);
                }
            } else {
                this.firebaseUser = null;
                this.currentUser = null;
                API.removeToken();
                this.updateUI(null);
            }
        });
    },

    // Update UI based on auth state
    updateUI(user) {
        const authLinks = document.getElementById('authLinks');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (user) {
            authLinks.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userName.textContent = user.name || user.email;
        } else {
            authLinks.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    },

    // Sign up new user
    async signup(name, email, password, year) {
        try {
            // Create user in Firebase Auth
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name
            await user.updateProfile({ displayName: name });

            // Get ID token
            const token = await user.getIdToken();
            API.setToken(token);

            // Create user profile in backend (Firestore)
            await API.post('/auth/signup', {
                name,
                email,
                password,
                year
            });

            this.currentUser = {
                id: user.uid,
                name: name,
                email: email
            };
            this.updateUI(this.currentUser);

            App.showToast('Account created successfully!', 'success');
            App.navigateTo('browse');

            return user;
        } catch (error) {
            throw new Error(this.getFirebaseErrorMessage(error));
        }
    },

    // Sign in existing user
    async login(email, password) {
        try {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Get ID token
            const token = await user.getIdToken();
            API.setToken(token);

            // Fetch profile from backend
            try {
                const profile = await API.get('/users/me');
                this.currentUser = profile;
            } catch (profileError) {
                // User exists in Firebase but not in Firestore - use Firebase data
                console.warn('User profile not found in Firestore, using Firebase data');
                this.currentUser = {
                    id: user.uid,
                    name: user.displayName || user.email,
                    email: user.email
                };
            }

            this.updateUI(this.currentUser);
            App.showToast('Welcome back!', 'success');
            App.navigateTo('browse');

            return user;
        } catch (error) {
            throw new Error(this.getFirebaseErrorMessage(error));
        }
    },

    // Sign out user
    async logout() {
        try {
            await firebaseAuth.signOut();
            API.removeToken();
            this.currentUser = null;
            this.firebaseUser = null;
            this.updateUI(null);
            App.showToast('Logged out successfully', 'info');
            App.navigateTo('home');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Refresh token (call periodically or before API calls)
    async refreshToken() {
        if (this.firebaseUser) {
            const token = await this.firebaseUser.getIdToken(true);
            API.setToken(token);
            return token;
        }
        return null;
    },

    // Get Firebase error message
    getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later';
            default:
                return error.message;
        }
    }
};

// Export for use in other files
window.Auth = Auth;
