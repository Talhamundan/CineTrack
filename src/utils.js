export const createSlug = (id, title) => {
    if (!title) return id;
    const slug = title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
    return `${id}-${slug}`;
};
