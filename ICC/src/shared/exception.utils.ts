export class ICCException {
  static readonly upperboundEmptyMessage: string = 'Upperbound is empty'
  static readonly noNodePlansMapFoundMessage: string = 'NodePlansMap not found'
  static readonly noNodeplansFoundMessage: string = 'No nodeplans found'
  static readonly nodePlansMapHasNoValidValuesMessage: string = 'NodePlansMap has no valid values or is empty'
  static readonly noNodeplanCombinationsFoundOrEmptyMessage: string = 'No plan combinations found or is empty'
  static readonly noNodeplansFoundOrEmptyMessage: string = 'Plans not found or empty'
  static readonly noNodepoolsWithoutIgnoredNodepoolTagsMessage: string = 'No nodepools found without the ignored nodepool tags'
  static readonly calculationIndexNotFoundOrEmptyMessage: string = 'Calculation index not found or empty'
  static readonly nodepoolListNotFoundOrEmptyMessage: string = 'Nodepool list not found or empty'
  static readonly forecastLengthSmallerThanValueMessage: string = 'Forecast length smaller than '
  static readonly nodepoolPlanNotFoundInNodePlansMapMessage: string = 'Nodepool plan not found in nodePlansMap'
  static readonly nodePoolsListIsNullOrUndefinedMessage: string = 'NodePoolsList is null or undefined'
  static readonly nodepoolsAreEmptyOrUndefinedMessage: string = 'Nodepools are empty or undefined'
  static readonly nodePlansMapIsEmptyOrUndefinedMessage: string = 'NodePlansMap is empty or undefined';
  static readonly nodePlanNotFoundInNodePlansMapMessage: string = 'Node plan not found in nodePlansMap: '
  static readonly clusterContainsOnlyOneNodeMessage: string = 'Cluster contains only one node';

  static logError(exceptionType: new (message: string) => Error, className: string, methodName: string, message: string, extraMessageValue?: any): void {
    if (extraMessageValue) message += extraMessageValue;
    console.error(
      `Class: ${className} | Method name: ${methodName} | Message: ${message}`,
    );
    throw new exceptionType(message);
  }
}
