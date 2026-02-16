import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    BarChart3, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    FolderKanban, 
    Building2,
    TrendingUp,
    Calendar
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
    todo: '#94A3B8',
    in_progress: '#F59E0B',
    review: '#3B82F6',
    done: '#10B981'
};

const PRIORITY_COLORS = {
    low: '#94A3B8',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444'
};

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('nexus_token');
        const headers = { Authorization: `Bearer ${token}` };

        Promise.all([
            axios.get(`${API_BASE}/analytics/dashboard`, { headers }),
            axios.get(`${API_BASE}/analytics/weekly`, { headers })
        ])
            .then(([dashboardRes, weeklyRes]) => {
                setStats(dashboardRes.data);
                setWeeklyData(weeklyRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const statCards = [
        { 
            label: 'Total Tasks', 
            value: stats?.totalTasks || 0, 
            icon: BarChart3, 
            color: '#3B82F6',
            trend: '+12%'
        },
        { 
            label: 'Completed', 
            value: stats?.completedTasks || 0, 
            icon: CheckCircle2, 
            color: '#10B981',
            trend: '+8%'
        },
        { 
            label: 'In Progress', 
            value: stats?.inProgressTasks || 0, 
            icon: Clock, 
            color: '#F59E0B',
            trend: '+5%'
        },
        { 
            label: 'Overdue', 
            value: stats?.overdueTasks || 0, 
            icon: AlertTriangle, 
            color: '#EF4444',
            trend: '-3%'
        },
        { 
            label: 'Projects', 
            value: stats?.totalProjects || 0, 
            icon: FolderKanban, 
            color: '#8B5CF6',
            trend: '+2'
        },
        { 
            label: 'Workspaces', 
            value: stats?.totalWorkspaces || 0, 
            icon: Building2, 
            color: '#06B6D4',
            trend: '+1'
        },
    ];

    // Prepare pie chart data for task status
    const statusPieData = stats?.tasksByStatus?.map(item => ({
        name: item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: item.count,
        color: STATUS_COLORS[item.status]
    })) || [];

    // Prepare pie chart data for task priority
    const priorityPieData = stats?.tasksByPriority?.map(item => ({
        name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
        value: item.count,
        color: PRIORITY_COLORS[item.priority]
    })) || [];

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip glass">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value" style={{ color: payload[0].color }}>
                        {payload[0].value} tasks
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for line chart
    const LineTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip glass">
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-value" style={{ color: '#10B981' }}>
                        Completed: {payload[0].value}
                    </p>
                    {payload[1] && (
                        <p className="tooltip-value" style={{ color: '#3B82F6' }}>
                            Created: {payload[1].value}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const completionRate = stats?.totalTasks > 0 
        ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) 
        : 0;

    return (
        <div className="dashboard-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p className="text-muted">Overview of your task management</p>
                </div>
                <div className="dashboard-metrics">
                    <div className="metric-badge">
                        <TrendingUp size={16} />
                        <span>{completionRate}% completion rate</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card) => (
                    <div key={card.label} className="stat-card glass">
                        <div className="stat-icon" style={{ 
                            backgroundColor: `${card.color}20`, 
                            color: card.color 
                        }}>
                            <card.icon size={22} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{card.value}</span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                        <div className="stat-trend" style={{
                            color: card.trend.startsWith('+') ? '#10B981' : '#EF4444'
                        }}>
                            {card.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="dashboard-charts-enhanced">
                {/* Pie Charts Row */}
                <div className="charts-row">
                    <div className="chart-card glass">
                        <div className="chart-header">
                            <h3>Task Distribution by Status</h3>
                            <p className="text-muted">Current task breakdown</p>
                        </div>
                        {statusPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => 
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {statusPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">
                                <BarChart3 size={48} className="text-muted" />
                                <p className="text-muted">No tasks yet</p>
                            </div>
                        )}
                    </div>

                    <div className="chart-card glass">
                        <div className="chart-header">
                            <h3>Task Priority Distribution</h3>
                            <p className="text-muted">Priority breakdown</p>
                        </div>
                        {priorityPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={priorityPieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => 
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {priorityPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">
                                <AlertTriangle size={48} className="text-muted" />
                                <p className="text-muted">No tasks yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weekly Completion Line Chart */}
                <div className="chart-card glass chart-full-width">
                    <div className="chart-header">
                        <div>
                            <h3>Weekly Task Completion</h3>
                            <p className="text-muted">Tasks completed over the last 7 days</p>
                        </div>
                        <div className="chart-legend-inline">
                            <span className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#10B981' }}></span>
                                Completed
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: '#3B82F6' }}></span>
                                Created
                            </span>
                        </div>
                    </div>
                    {weeklyData && weeklyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip content={<LineTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="completed" 
                                    stroke="#10B981" 
                                    strokeWidth={3}
                                    dot={{ fill: '#10B981', r: 5 }}
                                    activeDot={{ r: 7 }}
                                    animationDuration={1000}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="created" 
                                    stroke="#3B82F6" 
                                    strokeWidth={3}
                                    dot={{ fill: '#3B82F6', r: 5 }}
                                    activeDot={{ r: 7 }}
                                    animationDuration={1000}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-empty">
                            <Calendar size={48} className="text-muted" />
                            <p className="text-muted">No weekly data available</p>
                        </div>
                    )}
                </div>

                {/* Bar Chart for Status Comparison */}
                <div className="chart-card glass chart-full-width">
                    <div className="chart-header">
                        <h3>Task Status Overview</h3>
                        <p className="text-muted">Compare task counts by status</p>
                    </div>
                    {statusPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusPieData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="value" 
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1000}
                                >
                                    {statusPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="chart-empty">
                            <BarChart3 size={48} className="text-muted" />
                            <p className="text-muted">No tasks yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
