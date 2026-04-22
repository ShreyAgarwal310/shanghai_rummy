from typing import List, Optional                                                                                                                          
                                                                                                                                                             
  try:                                                                                                                                                       
      from app.melds.meld import Meld
      from app.melds.set_meld import SetMeld                                                                                                                 
      from app.melds.run_meld import RunMeld
      from app.rules.contract import Contract                                                                                                                
  except ModuleNotFoundError:
      import sys
      from pathlib import Path                                                                                                                               
      sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
      from app.melds.meld import Meld                                                                                                                        
      from app.melds.set_meld import SetMeld
      from app.melds.run_meld import RunMeld
      from app.rules.contract import Contract                                                                                                                
  
                                                                                                                                                             
  class StagedMeldArea:
      """
      Holds melds a player has staged before committing to lay down.
      Knows the contract for the current round and can report whether                                                                                        
      the staged melds satisfy it.                                                                                                                           
      """                                                                                                                                                    
                                                                                                                                                             
      def __init__(self, contract: Contract):
          self.contract = contract
          self._melds: List[Meld] = []
                                                                                                                                                             
      # --- mutation ---
                                                                                                                                                             
      def add_meld(self, meld: Meld) -> None:                                                                                                                
          self._melds.append(meld)
                                                                                                                                                             
      def remove_meld(self, index: int) -> Meld:
          return self._melds.pop(index)

      def clear(self) -> None:                                                                                                                               
          self._melds.clear()
                                                                                                                                                             
      # --- inspection ---

      @property
      def melds(self) -> List[Meld]:
          return list(self._melds)

      @property                                                                                                                                              
      def staged_sets(self) -> List[SetMeld]:
          return [m for m in self._melds if isinstance(m, SetMeld)]                                                                                          
                  
      @property
      def staged_runs(self) -> List[RunMeld]:
          return [m for m in self._melds if isinstance(m, RunMeld)]                                                                                          
   
      # --- contract satisfaction ---                                                                                                                        
                  
      @property                                                                                                                                              
      def required_sets(self) -> int:
          return self.contract.required_sets                                                                                                                 
                  
      @property
      def required_runs(self) -> int:
          return self.contract.required_runs

      @property
      def sets_complete(self) -> bool:
          valid_sets = sum(1 for m in self.staged_sets if m.is_valid())                                                                                      
          return valid_sets >= self.required_sets
                                                                                                                                                             
      @property   
      def runs_complete(self) -> bool:                                                                                                                       
          valid_runs = sum(1 for m in self.staged_runs if m.is_valid())
          return valid_runs >= self.required_runs

      def meets_contract(self) -> bool:                                                                                                                      
          """True only when all staged melds are valid and the contract counts are satisfied."""
          valid_set_count = sum(1 for m in self.staged_sets if m.is_valid())                                                                                 
          valid_run_count = sum(1 for m in self.staged_runs if m.is_valid())                                                                                 
          return (                                                                                                                                           
              valid_set_count == self.required_sets                                                                                                          
              and valid_run_count == self.required_runs
          )                                                                                                                                                  
   
      def status(self) -> dict:                                                                                                                              
          """Snapshot useful for sending to the frontend."""
          return {                                                                                                                                           
              "required_sets": self.required_sets,
              "required_runs": self.required_runs,                                                                                                           
              "staged_sets": len(self.staged_sets),
              "staged_runs": len(self.staged_runs),                                                                                                          
              "sets_complete": self.sets_complete,
              "runs_complete": self.runs_complete,                                                                                                           
              "meets_contract": self.meets_contract(),                                                                                                       
          }