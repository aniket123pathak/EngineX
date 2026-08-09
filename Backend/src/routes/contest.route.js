import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createContest, 
    getAllContests, 
    registerForContest,
    getContest,
    removeProblemFromContest,
    createProblemForContest
} from "../controllers/contest.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createContest).get(getAllContests);
router.route("/:contestId/register").post(registerForContest);
router.route("/:contestId").get(getContest);
router.route("/:contestId/problems/:problemId").delete(removeProblemFromContest);
router.route("/:contestId/problems").post(verifyJWT, createProblemForContest);

export default router;