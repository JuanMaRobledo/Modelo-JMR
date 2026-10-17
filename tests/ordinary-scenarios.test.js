import test from 'node:test';
import assert from 'node:assert/strict';
import {ordinaryScenarioAverage,isStressScenario} from '../docs/colombia/core.js';
test('ordinary average excludes disruption and renormalizes existing weights',()=>{
 const stories=[{name:'Base',probability:.5,value:100},{name:'Conservador',probability:.25,value:60},
   {name:'Optimista',probability:.15,value:140},{name:'Disruptivo',probability:.1,value:1}];
 const result=ordinaryScenarioAverage(stories);
 assert.ok(Math.abs(result.value-95.55555555555556)<1e-10);
 stories[3].value=1e9;
 assert.equal(ordinaryScenarioAverage(stories).value,result.value);
 assert.equal(result.stories.length,3);
 stories.forEach(s=>s.probability=null);
 assert.equal(ordinaryScenarioAverage(stories).value,100);
 assert.equal(ordinaryScenarioAverage(stories).weighted,false);
 stories[0].value=null;
 assert.equal(ordinaryScenarioAverage(stories).value,null);
 assert.equal(isStressScenario({id:'C',name:'Optimista'}),false);
 assert.equal(isStressScenario({id:'D',name:'Disrupción'}),true);
});
