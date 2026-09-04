import { zohoRequest } from "../services/zohoService.js";

export const getPeopleData = async (req, res) => {
  try {
    const data = await zohoRequest(
      "https://people.zoho.com/people/api/forms/P_EmployeeView/records",
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Zoho People Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch Zoho People data",
      zohoError: error.data || null,
    });
  }
};