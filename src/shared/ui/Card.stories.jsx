import Card from "./Card";
import Button from "./Button";

export default {
  title: "Shared/Card",
  component: Card,
};

export const WithAction = {
  args: {
    title: "카드 제목",
    action: <Button>액션</Button>,
    children: <p>카드 본문입니다.</p>,
  },
};
