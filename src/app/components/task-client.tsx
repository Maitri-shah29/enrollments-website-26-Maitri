"use client";

import type React from "react";
import { useEffect, useState } from "react";
import getGroupedTasks, {
  type GroupedTasksByDomain,
} from "../actions/get-grouped-tasks";
import submitTask from "../actions/submit-task";

export default function TaskClient() {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasksByDomain[]>([]);
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const data = await getGroupedTasks();
      setGroupedTasks(data);
      const init: Record<string, boolean> = {};
      data.forEach((d) => {
        init[d.domainId] = false;
      });
      setOpenDomains(init);
    }
    load();
  }, []);

  useEffect(() => {
    const initTexts: Record<string, string> = {};
    groupedTasks.forEach((domain) => {
      domain.tasks.forEach((task) => {
        initTexts[task.id] = task.TaskSubmission?.text ?? "";
      });
    });
    setTexts(initTexts);
  }, [groupedTasks]);

  async function SubmitTask(roundUserId: string, text: string) {
    await submitTask(roundUserId, text);
    console.log("placeholder submit", roundUserId, text);
  }

  function toggleDomain(id: string) {
    setOpenDomains((s) => ({ ...s, [id]: !s[id] }));
  }

  function setTextFor(id: string, value: string) {
    setTexts((s) => ({ ...s, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent, roundUserId: string) {
    e.preventDefault();
    const text = texts[roundUserId] || "";
    setSubmitting((s) => ({ ...s, [roundUserId]: true }));
    try {
      await SubmitTask(roundUserId, text);
    } finally {
      setSubmitting((s) => ({ ...s, [roundUserId]: false }));
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {groupedTasks.length === 0 && (
        <div className="text-center text-sm text-gray-500">No tasks</div>
      )}
      {groupedTasks.map((domain) => (
        <div key={domain.domainId} className="mb-4 border rounded-lg">
          <button
            type="button"
            onClick={() => toggleDomain(domain.domainId)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-t-lg"
          >
            <span className="font-medium text-gray-800">
              {domain.domainName}
            </span>
            <span className="text-sm text-gray-600">
              {openDomains[domain.domainId] ? "Hide" : "Show"}
            </span>
          </button>
          {openDomains[domain.domainId] && (
            <div className="px-4 py-3">
              {domain.tasks.length === 0 && (
                <div className="text-sm text-gray-500">
                  No tasks in this domain
                </div>
              )}
              {domain.tasks.map((taskRound) => (
                <div key={taskRound.id} className="mb-4 p-3 border rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {taskRound.Task?.text}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {taskRound.Task?.deadline
                          ? new Date(taskRound.Task.deadline).toLocaleString()
                          : "No deadline"}
                      </div>
                    </div>
                  </div>
                  <form
                    onSubmit={(e) => handleSubmit(e, taskRound.id)}
                    className="mt-3"
                  >
                    <textarea
                      value={texts[taskRound.id] || ""}
                      onChange={(e) => setTextFor(taskRound.id, e.target.value)}
                      placeholder="Paste submission text here"
                      className="w-full min-h-[80px] p-2 border rounded-md text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={
                          (taskRound.Task?.deadline
                            ? new Date(taskRound.Task.deadline).getTime() <
                              Date.now()
                            : false) || submitting[taskRound.id]
                        }
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          (
                            taskRound.Task?.deadline
                              ? new Date(taskRound.Task.deadline).getTime() >=
                                Date.now()
                              : true
                          )
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {submitting[taskRound.id]
                          ? "Submitting..."
                          : taskRound.Task?.deadline &&
                              new Date(taskRound.Task.deadline).getTime() <
                                Date.now()
                            ? "Deadline passed"
                            : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
