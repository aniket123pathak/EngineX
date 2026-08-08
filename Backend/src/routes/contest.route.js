import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createContest, 
    getAllContests, 
    registerForContest,
    addProblemToContest,
    getContest,
    removeProblemFromContest
} from "../controllers/contest.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createContest).get(getAllContests);
router.route("/:contestId/register").post(registerForContest);
router.route("/:contestId/problems").post(addProblemToContest);
router.route("/:contestId").get(getContest);
router.route("/:contestId/problems/:problemId").delete(removeProblemFromContest);

export default router;