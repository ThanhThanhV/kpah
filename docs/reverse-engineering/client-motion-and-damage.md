# KPAH 2.7.8 — client movement và combat feedback

> Nguồn: CFR 0.152 source của `z.java`, `ca.java`, `mj.java`, `km.java`, `hf.java`, `kw.java`. Các con số dưới đây là client-side animation/movement behavior; không đại diện cho server-authoritative physics hoặc công thức damage.

## Movement model

- Player actor: `ca extends z`; base actor/entity: `z extends bu`.
- Actor coordinates `l/m` là world pixel coordinates; map tile scale được dùng theo 16 pixel/tile trong path handling.
- Movement target lưu tại `ay/az`; `z.b(short x, short y)` đặt target và chuyển state `w=1` nếu vị trí khác.
- Trong movement update, actor đi theo một trục mỗi tick: ưu tiên X cho tới gần target X, sau đó mới tiến Y; không dùng diagonal vector normalization trong nhánh này.
- Base step `cT` khởi tạo từ static `z.cf` (default `3`). Mỗi update tăng step theo khoảng cách lớn nhất giữa trục hiện tại và target:

| Khoảng cách trên một trục | Step trong tick |
|---:|---:|
| `<= 30` | `cT` |
| `> 30` | `cT + 1` |
| `> 50` | `cT + 2` |
| `> 70` | `cT + 3` |
| `> 100` | `cT + 4` |

Nếu khoảng cách còn lại trên một trục nhỏ hơn step hiện tại, actor snap trục đó về target. Khi cả hai trục đã tới target, state chuyển về idle và cập nhật animation/timestamp.

`km` loop đặt mục tiêu khoảng 40 ms/tick (~25 FPS), nhưng không bảo đảm fixed timestep trên mọi thiết bị; vì vậy không chuyển `cT` thành px/second cứng khi chưa đo runtime thật.

## Click-to-move path

- `ca.b()` xử lý path waypoint `dj[]`; mỗi waypoint đóng gói tile offset X/Y, cộng map origin `mj.aU/aV`, nhân 16 và áp dụng actor offset.
- Trước khi đi tới waypoint, client kiểm tra collision/tile qua `mj.s.a(...)` và hướng hiện tại; nếu bị chặn thì clear path.
- Actor gọi `z.b(targetX,targetY)` để bắt đầu từng segment.
- C2S opcode `4` gửi short X + short Y theo throttle `mj.av=250` ms; caller là `ca.b()`.
- Server S2C spawn/snapshot opcodes `4/5/7` có thể cập nhật lại entity position; không coi client coordinate request là vị trí đã được server chấp nhận.

## Actor state và animation

`z` dùng byte state `w` để chọn nhánh update/animation: `0` idle, `1` moving, `2` action/skill, `3` disabled/death-like state trong các call sites quan sát được. Đây là animation/runtime state; chưa xác định đầy đủ tất cả transition và status overrides.

Không tìm thấy một jump-physics integrator riêng trong movement branch đã trace. Các animation/frame states có thể biểu diễn nhảy/đánh nhưng không đủ để suy ra quỹ đạo nhảy hoặc trọng lực; giữ phần jump physics là chưa xác minh.

## Floating damage / MISS feedback

`mj.a(String text, int fontStyle, int x, int y, int horizontalDrift, int verticalStep)` thêm floating label vào pool tối đa 15 slot:

- `text` được lowercase trước khi render.
- X/Y ban đầu gắn theo vị trí target/actor; horizontal drift nhân dấu ngẫu nhiên `-1/+1`.
- Mỗi update tick, age tăng theo `abs(verticalStep)`, X cộng horizontal drift, Y cộng vertical step.
- Label bị thu hồi khi age vượt 30 update ticks.
- Font style `0` dùng default font `mh.f`; style khác dùng `mh.i[style]`.
- Damage event với damage bằng `0` hiển thị `MISS`; damage khác hiển thị chuỗi `-<damage>` trong các handler đã trace.

Damage event handler đồng thời cập nhật current HP từ packet, cập nhật death/action state và kích hoạt attacker animation. Font style/flags chưa đủ để khẳng định chính xác màu crit, màu normal hay crit formula.

## Điều chưa được xác minh

- `cT` có thể thay đổi theo server stats/status; default `3` không phải speed cân bằng cuối cùng.
- Chưa có phép đo fixed timestep trên emulator/device và chưa biết server movement correction cadence ngoài request 250 ms.
- Chưa khôi phục đầy đủ jump/fall/knockback/slow/stun state transitions.
- Chưa suy ra damage formula, crit chance/multiplier, defense, elemental bonus hoặc damage cap từ floating labels.
- Tiếp theo: trace `cT` assignment và status effects, xác định jump/knockback branches, map font style IDs và combat flags với data tables.


## Server-driven generic cd entity movement

The opcode-4 S2C handler routes existing kind-1 entities through cd.a(x,y). That method stores target M/N only when cd.L >= 0; it does not directly replace current l/m. The initial cd.L value comes from the opcode-4 extra int. The cd.y() update branch uses the template step cg.c, snaps X when abs(dx) <= step and Y when abs(dy) < step, then moves X before Y by one step. Facing is set to right 3, left 2, up 1, down 0. Template type 4 stops this movement branch. During movement cd.b() cycles O through 0..6 and selects cZ 0 for O<=2, otherwise cZ 1.

The Web adapter now keeps current coordinates separate from target coordinates for existing kind-1 records with cd.L >= 0 and advances them on a 40 ms tick. It selects the source cd.c frame table with the current direction and movement frame state 0/1. Remaining differences: Q() can pause movement for effect/status flags; non-type-4 targets receive random vertical jitter (-4 + nextInt()%8); action/death states and their frame-state transitions are not yet mapped.
