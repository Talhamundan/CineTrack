export const createSlug = (id, title) => {
    if (!title) return id;
    const slug = title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
    return `${id}-${slug}`;
};

export const getStatusLabel = (status) => {
    switch (status) {
        case 'planned': return 'İzlenecek';
        case 'watching': return 'İzleniyor';
        case 'completed': return 'Bitirildi';
        case 'dropped': return 'Yarım Bırakıldı';
        default: return 'Listende';
    }
};
