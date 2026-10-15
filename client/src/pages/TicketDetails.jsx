import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusLabel = (status) =>
    status
        .replace("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

export default function TicketDetails() {
    const { id } = useParams();
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = currentUser.role === "ADMIN";

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function loadTicket() {
        setLoading(true);
        setError("");

        try {
            const [ticketResponse, commentsResponse] = await Promise.all([
                api.get(`/tickets/${id}`),
                api.get(`/tickets/${id}/comments`),
            ]);

            setTicket(ticketResponse.data.ticket);
            setComments(commentsResponse.data.comments || []);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load ticket.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTicket();

        if (isAdmin) {
            api.get("/users?limit=100")
                .then((res) => setUsers(res.data.users || []))
                .catch(() => {});
        }
    }, [id]);

    async function changeStatus(status) {
        setSaving(true);
        setError("");

        try {
            const res = await api.patch(`/tickets/${id}/status`, { status });
            setTicket(res.data.ticket || res.data);
            await loadTicket();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update status.");
        } finally {
            setSaving(false);
        }
    }

    async function assignTicket(event) {
        const assignedTo = event.target.value || null;
        setSaving(true);
        setError("");

        try {
            await api.patch(`/tickets/${id}/assign`, { assignedTo });
            await loadTicket();
        } catch (err) {
            setError(err.response?.data?.message || "Could not assign ticket.");
        } finally {
            setSaving(false);
        }
    }

    async function addComment(event) {
        event.preventDefault();

        if (!message.trim()) return;

        setSaving(true);
        setError("");

        try {
            await api.post(`/tickets/${id}/comments`, {
                message: message.trim(),
            });

            setMessage("");
            await loadTicket();
        } catch (err) {
            setError(err.response?.data?.message || "Could not add comment.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <main className="p-8 text-slate-600">Loading ticket...</main>;
    }

    if (!ticket) {
        return (
            <main className="p-8">
                <p className="text-red-600">{error || "Ticket not found."}</p>
                <Link
                    to="/dashboard"
                    className="mt-4 inline-block text-blue-600"
                >
                    ← Back to dashboard
                </Link>
            </main>
        );
    }

    const canClose =
        !isAdmin &&
        String(ticket.createdBy?._id || ticket.createdBy) ===
            String(currentUser._id) &&
        ticket.status !== "CLOSED";

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <Link
                    to="/dashboard"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to dashboard
                </Link>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-500">
                                Ticket #{String(ticket._id).slice(-8)}
                            </p>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                {ticket.title}
                            </h1>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                            {statusLabel(ticket.status)}
                        </span>
                    </div>

                    <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">
                        {ticket.description}
                    </p>

                    <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-slate-500">Created by</p>
                            <p className="mt-1 font-medium">
                                {ticket.createdBy?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {ticket.createdBy?.email || ""}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Assigned to
                            </p>
                            <p className="mt-1 font-medium">
                                {ticket.assignedTo?.name || "Unassigned"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">Created</p>
                            <p className="mt-1">
                                {ticket.createdAt
                                    ? new Date(
                                          ticket.createdAt,
                                      ).toLocaleString()
                                    : "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Last updated
                            </p>
                            <p className="mt-1">
                                {ticket.updatedAt
                                    ? new Date(
                                          ticket.updatedAt,
                                      ).toLocaleString()
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Update status
                                <select
                                    value={ticket.status}
                                    disabled={saving}
                                    onChange={(e) =>
                                        changeStatus(e.target.value)
                                    }
                                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3"
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {statusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Assign ticket
                                <select
                                    value={ticket.assignedTo?._id || ""}
                                    disabled={saving}
                                    onChange={assignTicket}
                                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3"
                                >
                                    <option value="">Unassigned</option>
                                    {users
                                        .filter((user) => user.isActive)
                                        .map((user) => (
                                            <option
                                                key={user._id}
                                                value={user._id}
                                            >
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                </select>
                            </label>
                        </div>
                    )}

                    {canClose && (
                        <button
                            onClick={() => changeStatus("CLOSED")}
                            disabled={saving}
                            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Close my ticket"}
                        </button>
                    )}
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        Conversation
                    </h2>

                    <div className="mt-5 space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No comments yet. Start the conversation below.
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <article
                                    key={comment._id}
                                    className="rounded-xl bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap justify-between gap-2">
                                        <p className="font-semibold text-slate-900">
                                            {comment.author?.name || "User"}
                                        </p>
                                        <time className="text-xs text-slate-500">
                                            {comment.createdAt
                                                ? new Date(
                                                      comment.createdAt,
                                                  ).toLocaleString()
                                                : ""}
                                        </time>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-slate-700">
                                        {comment.message}
                                    </p>
                                </article>
                            ))
                        )}
                    </div>

                    {ticket.status !== "CLOSED" && (
                        <form onSubmit={addComment} className="mt-6">
                            <label
                                htmlFor="comment"
                                className="font-medium text-slate-700"
                            >
                                Add a comment
                            </label>
                            <textarea
                                id="comment"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                maxLength={3000}
                                required
                                placeholder="Write your message..."
                                className="mt-2 block w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
                            />

                            <button
                                type="submit"
                                disabled={saving || !message.trim()}
                                className="mt-3 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Send comment"}
                            </button>
                        </form>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 text-sm text-red-600">
                            {error}
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}
