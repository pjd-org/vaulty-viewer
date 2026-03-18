export interface CodPageStyle {
  background: string;
  minHeight: string;
}

export const codPageStyle = (): CodPageStyle => ({
  background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d12 50%, #0f0a14 100%)",
  minHeight: "100vh",
});
