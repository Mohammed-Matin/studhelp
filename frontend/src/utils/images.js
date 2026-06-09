/** Curated fallbacks when logo/cover/banner URLs are not set in DB yet */

const COVERS = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f002d3cc?w=1400&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf83e33?w=1400&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&q=80',
];

const BANNERS = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1400&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1400&q=80',
];

const LOGOS = [
    'https://images.unsplash.com/photo-1611162617474-5b21e939e816?w=400&q=80',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80',
];

const HERO = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80';

function pick(pool, seed) {
    if (!seed) return pool[0];
    const hash = String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return pool[hash % pool.length];
}

export function getClubCover(club) {
    return club?.cover_url || pick(COVERS, club?.id || club?.name);
}

export function getClubLogo(club) {
    return club?.logo_url || pick(LOGOS, club?.id || club?.name);
}

export function getEventBanner(event) {
    return event?.banner_url || pick(BANNERS, event?.id || event?.title);
}

export function getHeroImage() {
    return HERO;
}

/** Suggested URLs club heads can paste in Settings — stored via existing PATCH API */
export const SUGGESTED_COVERS = COVERS.slice(0, 3);
export const SUGGESTED_BANNERS = BANNERS.slice(0, 3);
