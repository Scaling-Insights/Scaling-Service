import { ResponseDto } from 'src/modules/vultr/dto/response.dto';

export interface IGlobalService {
  calculateCurrentNRI(nodePoolsList: ResponseDto): number;
  getCurrentNRI(nodePoolsList: ResponseDto): number;
  getMinimalIndexOfNodePlansMap(): number;
  nodePlansMapHasValidValues(): boolean;
}
