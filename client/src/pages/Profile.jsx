import {
    ArrowLeft,
    CheckCircle2,
    CircleUserRound,
    KeyRound,
    LoaderCircle,
    LogOut,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Profile() {
    const navigate = useNavigate();

    // Profile state
    const [profile, setProfile] = useState(null);
    const [name, setName] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Load the current user's profile
    async function loadProfile() {
        setLoadingProfile(true);
        setProfileError("");

        try {
            const response = await api.get("/users/me");
            const user = response.data.user;

            setProfile(user);
            setName(user.name || "");
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
                return;
            }

            setProfileError(
                error.response?.data?.message ||
                    "Unable to load your profile. Please try again.",
            );
        } finally {
            setLoadingProfile(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    // Update profile information
    async function saveProfile(event) {
        event.preventDefault();

        setProfileError("");
        setProfileMessage("");

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            setProfileError("Your name must contain at least 2 characters.");
            return;
        }

        setSavingProfile(true);

        try {
            const response = await api.patch("/users/me", {
                name: trimmedName,
            });

            const updatedUser = response.data.user;

            setProfile((previousProfile) => ({
                ...previousProfile,
                ...updatedUser,
            }));

            // Keep the locally stored user information in sync.
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...storedUser,
                    ...updatedUser,
                }),
            );

            setName(updatedUser.name || trimmedName);
            setProfileMessage("Your profile has been updated successfully.");
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
                return;
            }

            setProfileError(
                error.response?.data?.message ||
                    "Unable to update your profile. Please try again.",
            );
        } finally {
            setSavingProfile(false);
        }
    }

    // Change account password
    async function changePassword(event) {
        event.preventDefault();

        setPasswordError("");
        setPasswordMessage("");

        if (!currentPassword) {
            setPasswordError("Please enter your current password.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "Your new password must contain at least 8 characters.",
            );
            return;
        }

        if (newPassword.length > 128) {
            setPasswordError("Your new password cannot exceed 128 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("The new passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError(
                "Your new password must be different from your current password.",
            );
            return;
        }

        setChangingPassword(true);

        try {
            const response = await api.patch("/users/me/password", {
                currentPassword,
                newPassword,
            });

            setPasswordMessage(
                response.data.message ||
                    "Your password has been changed successfully.",
            );

            // Clear sensitive fields after a successful change.
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
                return;
            }

            setPasswordError(
                error.response?.data?.message ||
                    "Unable to change your password. Please try again.",
            );
        } finally {
            setChangingPassword(false);
        }
    }

    // Log out the current user
    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    }

    // Reusable alert component
    function Alert({ type = "error", children }) {
        const styles =
            type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700";

        return (
            <div
                role={type === "success" ? "status" : "alert"}
                className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`}
            >
                {type === "success" && (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                )}

                <span>{children}</span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                {/* Back navigation */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
                >
                    <ArrowLeft size={17} />
                    Back to dashboard
                </Link>

                {/* Page heading */}
                <header className="mt-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                            <CircleUserRound size={26} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                My Profile
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage your personal information and account
                                security.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Loading state */}
                {loadingProfile ? (
                    <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
                        <LoaderCircle size={22} className="animate-spin" />
                        <span>Loading your profile...</span>
                    </div>
                ) : profile ? (
                    <>
                        {/* Profile information */}
                        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <UserRound
                                        size={20}
                                        className="text-blue-600"
                                    />

                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Personal information
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Update the name associated with your
                                    account.
                                </p>
                            </div>

                            {profileError && (
                                <div className="mb-5">
                                    <Alert>{profileError}</Alert>
                                </div>
                            )}

                            {profileMessage && (
                                <div className="mb-5">
                                    <Alert type="success">
                                        {profileMessage}
                                    </Alert>
                                </div>
                            )}

                            <form onSubmit={saveProfile} className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Full name
                                    </label>

                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        minLength={2}
                                        maxLength={100}
                                        required
                                        placeholder="Enter your full name"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Email address
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={profile.email || ""}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        Your email address cannot be changed
                                        from this page.
                                    </p>
                                </div>

                                {/* Role and account status */}
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-slate-700">
                                            Account role
                                        </p>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                profile.role === "ADMIN"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}
                                        >
                                            {profile.role || "USER"}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-slate-700">
                                            Account status
                                        </p>

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                profile.isActive
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {profile.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                {/* Profile actions */}
                                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                                    <button
                                        type="submit"
                                        disabled={savingProfile || !name.trim()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {savingProfile && (
                                            <LoaderCircle
                                                size={17}
                                                className="animate-spin"
                                            />
                                        )}

                                        {savingProfile
                                            ? "Saving..."
                                            : "Save changes"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <LogOut size={17} />
                                        Log out
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Change password */}
                        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <KeyRound
                                        size={20}
                                        className="text-blue-600"
                                    />

                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Change password
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Verify your current password before choosing
                                    a new one.
                                </p>
                            </div>

                            {passwordError && (
                                <div className="mb-5">
                                    <Alert>{passwordError}</Alert>
                                </div>
                            )}

                            {passwordMessage && (
                                <div className="mb-5">
                                    <Alert type="success">
                                        {passwordMessage}
                                    </Alert>
                                </div>
                            )}

                            <form
                                onSubmit={changePassword}
                                className="space-y-5"
                            >
                                {/* Current password */}
                                <div>
                                    <label
                                        htmlFor="currentPassword"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Current password
                                    </label>

                                    <input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(event) =>
                                            setCurrentPassword(
                                                event.target.value,
                                            )
                                        }
                                        required
                                        maxLength={128}
                                        placeholder="Enter your current password"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* New password */}
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        New password
                                    </label>

                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        placeholder="Enter a new password"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        Use at least 8 characters.
                                    </p>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Confirm new password
                                    </label>

                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value,
                                            )
                                        }
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        placeholder="Re-enter your new password"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* Password action */}
                                <div className="border-t border-slate-100 pt-5">
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {changingPassword ? (
                                            <>
                                                <LoaderCircle
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                                Updating password...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={17} />
                                                Change password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </>
                ) : (
                    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <Alert>
                                {profileError ||
                                    "Your profile could not be loaded."}
                            </Alert>
                        </div>

                        <button
                            type="button"
                            onClick={loadProfile}
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Security note */}
                <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                    Your password should remain private. Never share it with
                    anyone.
                </p>
            </div>
        </main>
    );
}
