<!-- TITLE: Custom machine learning models -->

# Custom machine learning models
 
Datagrok supports three ML engines out of the box: H2O, Caret, Chemprop. In addition, the platform allows users
to build their own customizable ML models. This capability provides full access and control to algorithms available
in ML libraries in any of the [supported languages](../develop/scripting.md#supported-languages). The users may
construct and configure any chosen model in their custom data pipeline.   
 
Custom model functionality is implemented as a two-step process using train and apply functions. Train function
is used to build/train a model based on provided features and a target variable. The trained model is then stored
as an object inside a given directory. Apply function receives previously saved model and applies it to provided
feature columns. The resulting predictions are returned in a form of a single column in a dataframe.  
 
Custom models utilize [predictive model](predictive-modeling.md) interface alongside other out-of-the-box solutions.
Once implemented, custom models can be chosen from the list of model engines.

## Train
 
#### Header parameters

- `#meta.mlname: CustomName` – Name of the custom train function
- `#meta.mlrole: train` –  Action (train or apply)
- `#description: Custom ML train function for KNN algorithm` – Description of the function
- `#language: Python` – Language (Python, R, Julia)
 
#### Input data parameters

- `#input: dataframe df` – Dataframe for training
- `#input: string predict_column` – List of features/column names separated by a comma
 
#### Input model parameters

- `#input: int parm1 {category: group1}` - Parameter 1 to build a model. Category is used for input parameters
   grouping within the UI
 
#### Output model parameters

- `#output: blob modelName` – Trained model object name. Complete trained model with an absolute path address
   is stored as a blob object to be retrieved and applied by the Apply function
 
## Apply
 
#### Header parameters

- `#meta.mlname: CustomName` – Name of the custom apply function (should match corresponding train function name)
- `#meta.mlrole: apply` –  Action (train or apply)
- `#description: Custom ML apply function for KNN algorithm` – Description of the function
- `#language: Python` – Language (Python, R, Julia)
 
#### Input model parameters

- `#input: blob model` – Trained model object name. Complete trained model with an absolute path address saved by
  the Train function.

#### Input data parameters

- `#input: dataframe df` - dataframe for prediction (contains only prediction features)
- `#input: string namesKeys` – optional list of original features/column names separated by comma
- `#input: string namesValues` – optional list of new features/column names separated by comma. If both `namesKeys`
   and `namesValues` are supplied, `namesKeys` will replace corresponding namesValues feature names before accessing
   the dataframe
 
#### Output parameters

- `#output: dataframe data_out` – single-column dataframe of predicted values
 
## Example

### `Train` function

```python
# name: pyknntrain
# meta.mlname: pyknn
# meta.mlrole: train
# description: custom python train func for knn
# language: python
# input: dataframe df
# input: string predict_column
# input: int n_neighbors {category: firstparm}
# input: string weights=uniform {category: parameters; choices: ["uniform", "distance"]}
# input: int leaf_size=30 {category: parameters}
# input: int p=1 {category: parameters; range:1-2}
# input: string metric=minkowski {category: parameters; choices: ["euclidean", "manhattan", "chebyshev", "minkowski"]}
# input: string algorithm = auto {category: parameters; choices: ["auto","ball_tree", "kd_tree", "brute"]}
# output: blob model
 
# Import necessary packages
import numpy as np
import pickle
from sklearn.neighbors import KNeighborsClassifier

# Extract/prepare train features and target variable
trainX = df.loc[ :,df.columns != predict_column]
trainY = np.asarray (df[predict_column])

# Build and train model
trained_model = KNeighborsClassifier(
	n_neighbors = n_neighbors,
	weights = weights,
	leaf_size= leaf_size,
	p = p,
	metric = metric,
	algorithm = algorithm
)
trained_model.fit(trainX, trainY)

# Save trained model
pickle.dump(trained_model, open(model, 'wb'))
```

### `Apply` function

```python
# name: pyknnapply
# meta.mlname: pyknn
# meta.mlrole: apply
# description: custom python apply for knn
# language: python
# input: blob model
# input: dataframe df
# input: string nameskeys [original features' names]
# input: string namesvalues [new features' names]
# output: dataframe data_out

# Load necessary packages
import numpy as np
import pickle

# If original(nameskeys) and new(namesvalues) passed, map original names to new
namesKeys = namesKeys.split(",")
namesValues = namesValues.split(",")
if len(namesKeys) > 0:
	 featuresNames = list(df)
	 for i in range(len(namesKeys)):
		df = df.rename(columns = {namesValues[i]: namesKeys[i]})

testX = np.asarray(df)

# Retrieve saved/trained model
trained_model = pickle.load(open(model, 'rb'))

# Predict using trained model
predY = trained_model.predict(testX)
data_out = pd.DataFrame({'pred': predY})
```

See also:

* "Custom machine learning models" [video](https://www.youtube.com/watch?v=G66MN30ZPGQ)