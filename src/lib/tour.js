import { load, save } from "./storage.js";

const DONE_KEY = "aiuolalab.tourDone";
export const tourDone = () => Boolean(load(DONE_KEY, false));
export const markTourDone = () => save(DONE_KEY, true);
