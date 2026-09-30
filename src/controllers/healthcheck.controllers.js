import { APIresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asynchandller.js";

/*
const healthCheck =  async (req, res, next) => {
    try {
        const user = await getUserFromDB()
        res.status(200).json(new APIresponse(200, { message : "server is running"}));
    } catch (error) {
        next(err)
    }
};
*/
const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(new APIresponse(200, { message: "server is running" }));
});

export {healthCheck} ;