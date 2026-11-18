import type { ComponentType } from "react";

// Simulations a chapter can embed with `![judul](sim:nama)`.
export const sims: Record<string, () => Promise<{ default: ComponentType<{ title: string }> }>> = {
  "load-balancer": () => import("./LoadBalancer"),
  "enkapsulasi": () => import("./Enkapsulasi"),
  "mqtt-pubsub": () => import("./MqttPubSub"),
  "pwm": () => import("./Pwm"),
};
