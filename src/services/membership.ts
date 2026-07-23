/**
 * Hạng thành viên suy ra từ ĐIỂM TÍCH LUỸ THẬT (lifetimePoints của
 * GET /api/v1/loyalty/my-points), không phải từ user.membershipTier — trường đó
 * chỉ tồn tại trong dữ liệu demo, luồng đăng nhập thật không bao giờ set.
 *
 * LƯU Ý: backend tích 1 điểm cho mỗi 1₫ chi trả (LoyaltyService.EARN_RATE = 1),
 * nên các ngưỡng dưới đây tính theo thang đó. Đây là số TẠM, cần bên kinh doanh chốt.
 */
export type TierKey = "bronze" | "silver" | "gold" | "platinum";

export interface TierDef {
    key: TierKey;
    /** Điểm tích luỹ tối thiểu để đạt hạng. */
    min: number;
    label: string;
    icon: string;
}

export const TIERS: TierDef[] = [
    { key: "bronze", min: 0, label: "Đồng", icon: "🥉" },
    { key: "silver", min: 5_000_000, label: "Bạc", icon: "🥈" },
    { key: "gold", min: 20_000_000, label: "Vàng", icon: "👑" },
    { key: "platinum", min: 50_000_000, label: "Bạch kim", icon: "💎" },
];

export interface ResolvedTier {
    current: TierDef;
    next: TierDef | null;
    /** Còn thiếu bao nhiêu điểm để lên hạng kế tiếp; 0 khi đã ở hạng cao nhất. */
    pointsToNext: number;
}

export const resolveTier = (lifetimePoints: number): ResolvedTier => {
    const index = TIERS.reduce(
        (acc, tier, i) => (lifetimePoints >= tier.min ? i : acc),
        0,
    );
    const next = TIERS[index + 1] ?? null;
    return {
        current: TIERS[index],
        next,
        pointsToNext: next ? Math.max(next.min - lifetimePoints, 0) : 0,
    };
};
