export const createClub = async (req, res) => {
    res.status(201).json({ message: "Club created" });
};

export const getClubs = async (req, res) => {
    res.status(200).json({ message: "Clubs retrieved" });
};

export const getClubById = async (req, res) => {
    res.status(200).json({ message: `Club ${req.params.id} retrieved` });
};
