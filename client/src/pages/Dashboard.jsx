import {
    CheckCircle2,
    Clock3,
    Headphones,
    LayoutDashboard,
    LoaderCircle,
    LogOut,
    Plus,
    RefreshCw,
    Search,
    Ticket as TicketIcon,
    UserCircle,
    Users,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const statusStyles = {
    OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
}

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>

                <div className={`rounded-lg p-2 ${color}`}>
                    <Icon size={20} />
                </div>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {value}
            </p>
        </div>
    );
}

function getStatusLabel(status) {
    return status.replace("_", " ");
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [creating, setCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
    });

    // Load the logged-in user.
    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (!token || !savedUser) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const parsedUser = JSON.parse(savedUser);

            if (!parsedUser || !parsedUser.role) {
                throw new Error("Invalid user session");
            }

            setUser(parsedUser);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    // Fetch tickets using the backend's role-based filtering.
    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (status) {
                params.status = status;
            }

            const response = await api.get("/tickets", { params });

            setTickets(response.data.tickets || []);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Unable to load tickets. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }, [search, status, navigate]);

    // Debounce searching to avoid making a request on every keystroke.
    useEffect(() => {
        if (!user) return;

        const timer = setTimeout(() => {
            loadTickets();
        }, 250);

        return () => clearTimeout(timer);
    }, [user, loadTickets]);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    }

    async function handleCreateTicket(event) {
        event.preventDefault();

        setSubmitting(true);
        setError("");

        try {
            await api.post("/tickets", {
                title: newTicket.title.trim(),
                description: newTicket.description.trim(),
            });

            setNewTicket({
                title: "",
                description: "",
            });

            setCreating(false);

            await loadTickets();
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to create the ticket.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    const counts = {
        total: tickets.length,
        open: tickets.filter((ticket) => ticket.status === "OPEN").length,
        progress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS")
            .length,
        resolved: tickets.filter((ticket) => ticket.status === "RESOLVED")
            .length,
    };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <LoaderCircle
                    className="animate-spin text-indigo-600"
                    size={30}
                />
            </div>
        );
    }

    const isAdmin = user.role === "ADMIN";

    return (
        <div className="min-h-screen bg-slate-50 md:flex">
            {/* Sidebar */}
            <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
                {/* Logo */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                    <div className="rounded-xl bg-indigo-600 p-2 text-white">
                        <Headphones size={22} />
                    </div>

                    <div>
                        <p className="font-bold text-slate-900">SupportDesk</p>

                        <p className="text-xs text-slate-500">
                            Management Portal
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-wrap gap-2 p-3 md:flex-1 md:flex-col">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => navigate("/users")}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                            <Users size={18} />
                            User management
                        </button>
                    )}

                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                        <UserCircle size={18} />
                        My profile
                    </button>
                </nav>

                {/* Logged-in user */}
                <div className="border-t border-slate-100 p-4">
                    <div className="mb-4">
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                            {user.email}
                        </p>

                        <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {user.role}
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1 p-5 sm:p-8">
                {/* Header */}
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">
                            Welcome back, {user.name}
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {isAdmin
                                ? "Manage all support requests and track their progress."
                                : "Create support requests and track your tickets."}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setCreating(!creating);
                            setError("");
                        }}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        Create ticket
                    </button>
                </header>

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <span>{error}</span>

                        <button
                            onClick={loadTickets}
                            className="flex shrink-0 items-center gap-1 font-semibold"
                        >
                            <RefreshCw size={14} />
                            Retry
                        </button>
                    </div>
                )}

                {/* Create ticket form */}
                {creating && (
                    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Create a support ticket
                        </h2>

                        <form
                            onSubmit={handleCreateTicket}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="title"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Ticket title
                                </label>

                                <input
                                    id="title"
                                    required
                                    minLength={3}
                                    maxLength={150}
                                    value={newTicket.title}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            title: event.target.value,
                                        })
                                    }
                                    placeholder="Briefly describe your issue"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="description"
                                    required
                                    minLength={10}
                                    maxLength={5000}
                                    rows={4}
                                    value={newTicket.description}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            description: event.target.value,
                                        })
                                    }
                                    placeholder="Explain the problem and what you have tried"
                                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Creating..."
                                        : "Submit ticket"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreating(false);
                                        setNewTicket({
                                            title: "",
                                            description: "",
                                        });
                                    }}
                                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* Statistics */}
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Tickets in view"
                        value={counts.total}
                        icon={TicketIcon}
                        color="bg-indigo-50 text-indigo-600"
                    />

                    <StatCard
                        title="Open"
                        value={counts.open}
                        icon={Clock3}
                        color="bg-blue-50 text-blue-600"
                    />

                    <StatCard
                        title="In progress"
                        value={counts.progress}
                        icon={RefreshCw}
                        color="bg-amber-50 text-amber-600"
                    />

                    <StatCard
                        title="Resolved"
                        value={counts.resolved}
                        icon={CheckCircle2}
                        color="bg-emerald-50 text-emerald-600"
                    />
                </section>

                {/* Tickets table */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                {isAdmin
                                    ? "All support tickets"
                                    : "My support tickets"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {isAdmin
                                    ? "Review and manage support requests."
                                    : "Review your requests and track their progress."}
                            </p>
                        </div>

                        <button
                            onClick={loadTickets}
                            aria-label="Refresh tickets"
                            disabled={loading}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    {/* Search and status filter */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search tickets by title..."
                                aria-label="Search tickets"
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        <select
                            aria-label="Filter by ticket status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="">All statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
                            <LoaderCircle
                                className="animate-spin text-indigo-600"
                                size={22}
                            />
                            Loading tickets...
                        </div>
                    ) : tickets.length === 0 ? (
                        /* Empty state */
                        <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                            <div className="rounded-full bg-slate-100 p-4">
                                <TicketIcon
                                    size={26}
                                    className="text-slate-400"
                                />
                            </div>

                            <h3 className="mt-4 font-semibold text-slate-900">
                                No tickets found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                {search || status
                                    ? "Try changing your search or filters."
                                    : "Create a support ticket to get started."}
                            </p>

                            {!search && !status && (
                                <button
                                    onClick={() => setCreating(true)}
                                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Create your first ticket
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Tickets table */
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">
                                            Ticket
                                        </th>

                                        {isAdmin && (
                                            <th className="px-5 py-4 font-semibold">
                                                Created by
                                            </th>
                                        )}

                                        <th className="px-5 py-4 font-semibold">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 font-semibold">
                                            Assigned to
                                        </th>

                                        <th className="px-5 py-4 font-semibold">
                                            Updated
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket._id}
                                            onClick={() =>
                                                navigate(
                                                    `/tickets/${ticket._id}`,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    navigate(
                                                        `/tickets/${ticket._id}`,
                                                    );
                                                }
                                            }}
                                            tabIndex={0}
                                            role="link"
                                            aria-label={`Open ticket: ${ticket.title}`}
                                            className="cursor-pointer transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {ticket.title}
                                                </p>

                                                <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                                    {ticket.description}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    #
                                                    {String(ticket._id).slice(
                                                        -8,
                                                    )}
                                                </p>
                                            </td>

                                            {isAdmin && (
                                                <td className="px-5 py-4">
                                                    <p className="text-slate-700">
                                                        {ticket.createdBy
                                                            ?.name || "Unknown"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {ticket.createdBy
                                                            ?.email || ""}
                                                    </p>
                                                </td>
                                            )}

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                        statusStyles[
                                                            ticket.status
                                                        ] || statusStyles.OPEN
                                                    }`}
                                                >
                                                    {getStatusLabel(
                                                        ticket.status,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {ticket.assignedTo?.name ||
                                                    "Unassigned"}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {formatDate(ticket.updatedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="mt-6 text-center text-xs text-slate-400">
                    SupportDesk · Support Management Portal
                </footer>
            </main>
        </div>
    );
}
