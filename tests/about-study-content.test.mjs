import assert from "node:assert/strict";
import test from "node:test";
import {
  communityStories,
  getConfirmedCommunityStories,
} from "../src/lib/about-study-content.ts";

const approvedStory = {
  id: "activity-fixture",
  title: "Test activity",
  summary: "An isolated publication-rule fixture, not public editorial copy.",
  place: "Test place",
  activityDate: "2026-10-06",
  source: "Internal evidence fixture",
  status: "confirmed",
  publicationApproved: true,
};

test("community intentions do not seed completed community stories", () => {
  assert.deepEqual(communityStories, []);
  assert.deepEqual(getConfirmedCommunityStories(), []);
});

test("community stories require both confirmation and publication permission", () => {
  const stories = [
    { ...approvedStory, status: "draft" },
    { ...approvedStory, publicationApproved: false },
    { ...approvedStory, status: "draft", publicationApproved: false },
    approvedStory,
  ];
  assert.deepEqual(getConfirmedCommunityStories(stories), [approvedStory]);
  assert.equal(
    stories.length,
    4,
    "Filtering never mutates the editorial record",
  );
});

test("approved community records still need complete activity and evidence fields", () => {
  for (const field of [
    "id",
    "title",
    "summary",
    "place",
    "activityDate",
    "source",
  ]) {
    for (const value of ["", " \n\t "]) {
      assert.deepEqual(
        getConfirmedCommunityStories([{ ...approvedStory, [field]: value }]),
        [],
        `Missing ${field} prevents publication`,
      );
    }
  }
});
