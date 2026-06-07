export const sendMessage = async (req, res) => {
    res.status(201).json({ message: "Message sent" });
};

export const getMessages = async (req, res) => {
    res.status(200).json({ message: "Messages retrieved" });
};
