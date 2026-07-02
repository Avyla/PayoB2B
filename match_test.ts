import { MatchService } from './backend/src/services/match.service';
async function main() {
  const service = new MatchService();
  const res = await service.matchTransaction("486ee9c6-680c-46e0-b897-d0be8f631d9c");
  console.log("MATCH RESULT:", res);
}
main();
