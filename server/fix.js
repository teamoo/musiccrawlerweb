Meteor.methods({
  fixMongoIds: function () {
    fixMongoIds( [Meteor.users, Links, Sites] );
    return true;
  }
});

function fixCollectionIds( CollectionToFix, Collections, ElementsCurrentCount, ElementsTotalCount) {

  var percent = Math.round(100 * ElementsCurrentCount / ElementsTotalCount);
    //var re = new RegExp("", "i");

  var elementsToFix = [];

  //store in a liste each collection elements
  CollectionToFix.find( { _id : /-/ } ).forEach( function (element) {
    elementsToFix.push(element);
  });

  //for each element in collection
  _.each(elementsToFix, function(element) {
    //clone element
    var elementClone = EJSON.clone(element);
    var oldId = elementClone._id.toString();
    delete elementClone._id; //remove _id on clone
    //console.log(oldId);

    //in collection replace old element by new cloned one, get the new id
    var newId = oldId;
    CollectionToFix.remove(oldId);
    newId = CollectionToFix.insert(elementClone).toString();
    //console.log(newId);
    
    //update progression display ...
    ElementsCurrentCount = ElementsCurrentCount + 1;
    var newPercent = Math.round(100 * ElementsCurrentCount / ElementsTotalCount);
    if(percent!==newPercent) {
      percent=newPercent;
      console.log(percent + "%");
    }

    var regex = new RegExp(oldId, "g");

    //for each other collection
    _.each(Collections, function(otherCollection) {
      if(otherCollection!==CollectionToFix) {
        var otherElementsToFix = [];
        //store every element needing using the targeted id and needing a fix
        otherCollection.find( {} ).forEach( function (otherElement) {
          var otherElementStr = EJSON.stringify(otherElement);
          if(otherElementStr.search(oldId)>=0) {
            otherElementsToFix.push(otherElement);
          }
        });
        //fix all elements in list, replacing old id by new one
        _.each(otherElementsToFix, function(otherElement) {
          var otherElementStr = EJSON.stringify(otherElement);
          otherElementStr = otherElementStr.replace(regex, newId);
          var newOtherElement = EJSON.parse(otherElementStr);
          delete newOtherElement._id;
          otherCollection.update(otherElement._id, { $set: newOtherElement } );
          //console.log(oldId);
          //console.log(otherElementStr);
        })
      }
    });



  });

  return ElementsCurrentCount;

}

function fixMongoIds( Collections ) {
  console.log("fixing ids... this may take a while...");

  var collections = Collections;
  var elementsTotalCount = 0;
  var elementsCurrentCount = 0;

  //compute element total count
  _.each(collections, function(collection) {
    elementsTotalCount = elementsTotalCount + collection.find({}).count();
  });

  //fix ids on each collection, and update how many element fixed count
  _.each(collections, function(collection) {
    elementsCurrentCount = fixCollectionIds(collection, collections, elementsCurrentCount, elementsTotalCount);
  });

  console.log("done fixing ids.")

}
