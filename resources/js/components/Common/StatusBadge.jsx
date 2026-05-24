import React from 'react';
import { STATUS_LABELS, STATUS_COLORS, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../../utils/constants';

export function ApplicationStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export function JobStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
            {JOB_STATUS_LABELS[status] || status}
        </span>
    );
}
