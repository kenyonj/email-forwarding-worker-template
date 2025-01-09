// test/index.spec.ts
import { beforeEach, describe, it, expect, vi } from "vitest";
import worker from "../src/index";

interface ProvidedEnv {
  EMAIL_CONFIG: string;
}

describe("Email Worker", () => {
  let env: ProvidedEnv;

  beforeEach(() => {
    env = {
      EMAIL_CONFIG: JSON.stringify([
        {
          domain: "my-domain.com",
          config: [
            {
              aliases: ["one", "anotherone", "thisisanemail", "hello"],
              emailAddress: "sampleparent@email.com",
              groups: ["kids", "parents", "family"],
              type: "parent",
            },
            {
              aliases: ["sally", "sallylastname"],
              emailAddress: "sallysample@email.com",
              groups: ["kids", "family"],
              type: "child",
            },
          ],
        },
      ]),
    } as ProvidedEnv;
  });

  it("forwards email for a valid alias", async () => {
    const message = {
      to: "sally@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).toHaveBeenCalledWith("sallysample@email.com");
    expect(message.forward).toHaveBeenCalledWith("sampleparent@email.com"); // Parent email for "child"
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it("rejects email for an invalid recipient", async () => {
    const message = {
      to: "unknown@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).not.toHaveBeenCalled();
    expect(message.setReject).toHaveBeenCalledWith("Recipient not allowed");
  });

  it("forwards email for a group alias", async () => {
    const message = {
      to: "kids@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).toHaveBeenCalledWith("sampleparent@email.com");
    expect(message.forward).toHaveBeenCalledWith("sallysample@email.com");
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it("handles alias with suffix correctly", async () => {
    const message = {
      to: "hello.info@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).toHaveBeenCalledWith("sampleparent@email.com");
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it("handles a group alias with suffix correctly", async () => {
    const message = {
      to: "kids.1234@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).toHaveBeenCalledWith("sampleparent@email.com");
    expect(message.forward).toHaveBeenCalledWith("sallysample@email.com");
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it("handles a group alias with plus signs and the suffix correctly", async () => {
    const message = {
      to: "kids+1234@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).toHaveBeenCalledWith("sampleparent@email.com");
    expect(message.forward).toHaveBeenCalledWith("sallysample@email.com");
    expect(message.setReject).not.toHaveBeenCalled();
  });

  it("rejects email when configuration is invalid", async () => {
    env.EMAIL_CONFIG = "{ invalid json }";

    const message = {
      to: "sally@my-domain.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).not.toHaveBeenCalled();
    expect(message.setReject).toHaveBeenCalledWith(
      "Server configuration error",
    );
  });

  it("rejects email when there is no config found for the domain", async () => {
    const message = {
      to: "sally@testing.com",
      setReject: vi.fn(),
      forward: vi.fn(),
    };

    await worker.email(message, env);

    expect(message.forward).not.toHaveBeenCalled();
    expect(message.setReject).toHaveBeenCalledWith(
      "Server configuration error",
    );
  });
});
