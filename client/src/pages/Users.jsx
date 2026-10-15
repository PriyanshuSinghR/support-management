import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "USER",
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = { limit: 100 };

            if (search.trim()) params.search = search.trim();
            if (roleFilter) params.role = roleFilter;
            if (activeFilter) params.active = activeFilter;

            const response = await api.get("/users", { params });
            setUsers(response.data.users || []);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load users.");
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, activeFilter]);

    useEffect(() => {
        const timer = setTimeout(loadUsers, 250);
        return () => clearTimeout(timer);
    }, [loadUsers]);

    function startEdit(user) {
        setEditingId(user._id);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        });
        setShowForm(true);
        setError("");
    }

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError("");
    }

    async function submitForm(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (editingId) {
                await api.patch(`/users/${editingId}`, {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                });
            } else {
                await api.post("/users", form);
            }

            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);
            await loadUsers();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save user.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(user) {
        const action = user.isActive ? "deactivate" : "activate";

        if (
            !window.confirm(`Are you sure you want to ${action} ${user.name}?`)
        ) {
            return;
        }

        setError("");

        try {
            await api.patch(`/users/${user._id}`, {
                isActive: !user.isActive,
            });
            await loadUsers();
        } catch (err) {
            setError(
                err.response?.data?.message || `Could not ${action} user.`,
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <Link
                    to="/dashboard"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to dashboard
                </Link>

                <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            User Management
                        </h1>
                        <p className="mt-2 text-slate-500">
                            Create accounts and manage access to the portal.
                        </p>
                    </div>

                    <button
                        onClick={startCreate}
                        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                    >
                        + Create user
                    </button>
                </header>

                {error && (
                    <p
                        role="alert"
                        className="mt-5 rounded-lg bg-red-50 p-3 text-red-700"
                    >
                        {error}
                    </p>
                )}

                {showForm && (
                    <form
                        onSubmit={submitForm}
                        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2"
                    >
                        <h2 className="text-lg font-bold md:col-span-2">
                            {editingId ? "Edit user" : "Create user"}
                        </h2>

                        <label className="text-sm font-medium text-slate-700">
                            Full name
                            <input
                                required
                                minLength={2}
                                maxLength={100}
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="mt-2 block w-full rounded-lg border border-slate-300 p-3"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Email
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="mt-2 block w-full rounded-lg border border-slate-300 p-3"
                            />
                        </label>

                        {!editingId && (
                            <label className="text-sm font-medium text-slate-700">
                                Initial password
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                    className="mt-2 block w-full rounded-lg border border-slate-300 p-3"
                                />
                            </label>
                        )}

                        <label className="text-sm font-medium text-slate-700">
                            Role
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3"
                            >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </label>

                        <div className="flex gap-3 md:col-span-2">
                            <button
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                      ? "Save changes"
                                      : "Create user"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-slate-300 px-5 py-3"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-3">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or email..."
                            className="rounded-lg border border-slate-300 p-3"
                        />

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white p-3"
                        >
                            <option value="">All roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="USER">User</option>
                        </select>

                        <select
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white p-3"
                        >
                            <option value="">All account statuses</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="p-8 text-center text-slate-500">
                            Loading users...
                        </p>
                    ) : users.length === 0 ? (
                        <p className="p-8 text-center text-slate-500">
                            No users found.
                        </p>
                    ) : (
                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Joined</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr
                                            key={user._id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="p-3">
                                                <p className="font-semibold text-slate-900">
                                                    {user.name}
                                                </p>
                                                <p className="text-slate-500">
                                                    {user.email}
                                                </p>
                                            </td>

                                            <td className="p-3">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td className="p-3">
                                                <span
                                                    className={
                                                        user.isActive
                                                            ? "text-emerald-700"
                                                            : "text-red-600"
                                                    }
                                                >
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="p-3 text-slate-500">
                                                {new Date(
                                                    user.createdAt,
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() =>
                                                            startEdit(user)
                                                        }
                                                        className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            toggleActive(user)
                                                        }
                                                        className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50"
                                                    >
                                                        {user.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
