export const CLUB_ROLES = [
    { value: 'CORE_COMMITTEE', label: 'Core Committee' },
    { value: 'EXECUTIVE', label: 'Executive' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'DESIGN', label: 'Design' },
    { value: 'PUBLICITY', label: 'Publicity' },
    { value: 'ADMINISTRATIVE_SPONSORS', label: 'Administrative & Sponsors' },
    { value: 'CUSTOM', label: 'Member' },
];

export const MANAGER_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE'];
export const CLUB_HEAD_ROLES = ['CORE_COMMITTEE'];
export const GALLERY_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE', 'DESIGN', 'PUBLICITY'];

export function formatRole(role) {
    return role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || '';
}

export function isManager(role) {
    return role && MANAGER_ROLES.includes(role);
}

export function isClubHead(role) {
    return role && CLUB_HEAD_ROLES.includes(role);
}

export function canManageGallery(role) {
    return role && GALLERY_ROLES.includes(role);
}
