export const createPayment = async (req, res) => {
    res.status(201).json({ message: "Payment created" });
};

export const getPaymentStatus = async (req, res) => {
    res.status(200).json({ message: `Payment status for ${req.params.id}` });
};
