// Benchmark strategy: buy on day 1, hold forever. Every other strategy must
// beat this after costs to justify its existence.
export function buyAndHold() {
  return {
    name: "BuyAndHold",
    onBar: () => "LONG",
  };
}
