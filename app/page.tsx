import { getChatGPTUser } from './chatgpt-auth';
import Workbench from './workbench';

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <Workbench
      name={user?.displayName || 'Kỹ sư BIM Tuyến'}
      email={user?.email || 'phucnguyentpbd@gmail.com'}
    />
  );
}
