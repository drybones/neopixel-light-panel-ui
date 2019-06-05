import React, { Component } from 'react';
import reactCSS from 'reactcss'
import { ChromePicker } from 'react-color';
import './App.css';

var shortid = require('shortid');

var baseUrl = process.env.LIGHTPANEL_API_SERVER || 'http://localhost:3000';

const defaultWavelet = {
    "id": null,
    "color": "#ffffff",
    "freq": 0.2,
    "lambda": 0.5,
    "delta": 0.0,
    "x": 0.0,
    "y": 0,
    "min": 0.1,
    "max": 0.7,
    "clip": true
};

const defaultPreset = {
    "id": null,
    "name": "New Preset",
    "wavelets": [],
};

class App extends Component {
  render() {
    return (
      <div className="App container">
        <h1 className="my-3">Light Panel Config</h1>
        <PresetConfig/>
      </div>
    );
  }
}

class PresetConfig extends Component {
  constructor(props) {
    super(props);
    this.state = 
    {
      presets: [],
      currentPreset: null,
      presetConfig: null,
    }
    this.handleWaveletChange = this.handleWaveletChange.bind(this);  
    this.handlePresetListClick = this.handlePresetListClick.bind(this);  
    this.handleNewWaveletClick = this.handleNewWaveletClick.bind(this);
    this.handleDeleteWaveletClick = this.handleDeleteWaveletClick.bind(this);
    this.handleNewPresetClick = this.handleNewPresetClick.bind(this);
    this.handleDeletePresetClick = this.handleDeletePresetClick.bind(this);
    this.handlePresetNameChange = this.handlePresetNameChange.bind(this);
    this.handleSoloWaveletClick = this.handleSoloWaveletClick.bind(this);
  }

  componentDidMount() {
    this.getPresetList();
  }

  getPresetList() {
    fetch(baseUrl+'/api/wave_configs/')
      .then((result) => {
        return result.json();
      }).then((jsonresult) => {
        this.setState({presets: jsonresult});
      });
  }

  handlePresetListClick(id) {
    this.setState({currentPreset: id});
    this.setLightPanelMode(id);
    fetch(baseUrl+'/api/wave_config/'+id)
      .then((result) => {
        return result.json();
      }).then((jsonresult) => {
        this.setState({presetConfig: jsonresult});
      });
  }

  setLightPanelMode(id) {
    fetch(baseUrl+'/mode/interactive_wave/'+id);
  }

  handleNewPresetClick() {
    let newPreset = {...defaultPreset};    
    newPreset.id = shortid.generate();
    newPreset.wavelets = newPreset.wavelets.slice(); // Deeper copy on the array
    
    this.updateServerConfig(newPreset.id, newPreset)
      .then(this.setLightPanelMode(newPreset.id));

    let newPresetList = this.state.presets.slice();
    newPresetList.push({id: newPreset.id, name: newPreset.name});

    this.setState({
      presets: newPresetList,
      currentPreset: newPreset.id,
      presetConfig : newPreset
    });
  }

  handleDeletePresetClick(id) {
    let newPresets = this.state.presets.slice();
    let thisPresetIndex = this.state.presets.findIndex(o => o.id === id);
    if(thisPresetIndex !== -1) {
      newPresets.splice(thisPresetIndex, 1);
    }

    this.setState({
      presets: newPresets,
    });

    if(this.state.currentPreset === id) {
      this.setState({
        currentPreset: null,
        presetConfig: null,
      })
    }

    fetch(baseUrl+'/api/wave_config/'+id, {
      cache: 'no-cache', // *default, cache, reload, force-cache, only-if-cached
      headers: {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json'
      },
      method: 'DELETE', // *GET, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *same-origin
      redirect: 'follow', // *manual, error
      referrer: 'no-referrer', // *client
    });
  }

  handleNewWaveletClick() {
    let newPresetConfig = {...this.state.presetConfig};
    let newWavelet = {...defaultWavelet};
    newWavelet.id = shortid.generate();
    newPresetConfig.wavelets.push(newWavelet);
    this.setState({
      presetConfig: newPresetConfig,
    });
    this.updateServerConfig(newPresetConfig.id, newPresetConfig);
  }

  handleDeleteWaveletClick(id) {
    let newPresetConfig = {...this.state.presetConfig};
    let thisWaveletIndex = newPresetConfig.wavelets.findIndex(w => w.id === id);
    if(thisWaveletIndex !== -1) {
      newPresetConfig.wavelets.splice(thisWaveletIndex, 1);
    }

    this.setState({
      presetConfig: newPresetConfig,
    });
    this.updateServerConfig(newPresetConfig.id, newPresetConfig);
  }

  handleSoloWaveletClick(id) {
    let newPresetConfig = {...this.state.presetConfig};
    newPresetConfig.wavelets.forEach(w => {
      w.solo = (w.id === id ? !(w.solo) : false);
    });

    this.setState({
      presetConfig: newPresetConfig,
    });
    this.updateServerConfig(newPresetConfig.id, newPresetConfig);
  }

  handleWaveletChange(waveletConfigId, event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    
    let newPresetConfig = {...this.state.presetConfig};
    let wavelet = newPresetConfig.wavelets.find(w => w.id === waveletConfigId);

    // TODO Use a proper numeric input that handles this...
    const numnericParams = new Set(["freq","lambda","delta","x","y","min","max"]);
    if(numnericParams.has(name)) {
      wavelet[name] = Number(value);
    } else {
      wavelet[name] = value;
    }

    // Keep the brightness sliders from inverting
    if(name === "min") {
      wavelet.max = Math.max(wavelet.min, wavelet.max);
    }
    if(name === "max") {
      wavelet.min = Math.min(wavelet.min, wavelet.max);
    }

    this.setState({
      presetConfig: newPresetConfig,
    });

    this.updateServerConfig(newPresetConfig.id, newPresetConfig);
  }

  handlePresetNameChange(event) {
    let newPresetConfig = {...this.state.presetConfig};
    let newPresets = this.state.presets.slice();
    
    newPresetConfig.name = event.target.value;
    let presetIndex = newPresets.findIndex(o => o.id === this.state.currentPreset);
    if(presetIndex !== -1) {
      newPresets[presetIndex].name = newPresetConfig.name;
    }

    this.setState({
      presetConfig: newPresetConfig,
      presets: newPresets,
    });
    this.updateServerConfig(this.state.currentPreset, newPresetConfig);
  }

  updateServerConfig(id, config) {
    return this.putData(baseUrl+'/api/wave_config/'+id, config);
  }

  putData(url, data) {
    // Default options are marked with *
    return fetch(url, {
      body: JSON.stringify(data), // must match 'Content-Type' header
      cache: 'no-cache', // *default, cache, reload, force-cache, only-if-cached
      headers: {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json'
      },
      method: 'PUT', // *GET, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *same-origin
      redirect: 'follow', // *manual, error
      referrer: 'no-referrer', // *client
    });
  }
  
  render() {
    return (
      <div className="row">
        <div className="col-md-3">
          <PresetList presets={this.state.presets} currentPreset={this.state.currentPreset} onClick={this.handlePresetListClick} onNewPresetClick={this.handleNewPresetClick}/>
        </div>
        <div className="col-md">
          <PresetItem 
            presetConfig={this.state.presetConfig} 
            onPresetNameChange={this.handlePresetNameChange} 
            onDeletePresetClick={this.handleDeletePresetClick}
            onWaveletChange={this.handleWaveletChange} 
            onNewWaveletClick={this.handleNewWaveletClick} 
            onDeleteWaveletClick={this.handleDeleteWaveletClick} 
            onSoloWaveletClick={this.handleSoloWaveletClick}
          />
        </div>
      </div>
    );
  }

}

function PresetList(props)
{
  let presetItems = props.presets.map((preset) =>
    <li className={(props.currentPreset === preset.id) ? "list-group-item active" : "list-group-item"} key={preset.id} preset-id={preset.id} active={(props.currentPreset === preset.id)} onClick={() => props.onClick(preset.id)}>{preset.name}</li>
  );
  return (
    <div className="PresetList">
      <ul className="list-group">
        {presetItems}
      </ul>
      <button className="btn btn-secondary btn-block mt-2 mb-3" onClick={props.onNewPresetClick}>+ Add new preset</button>
    </div>
  );
}

function PresetItem(props)
{
  if(props.presetConfig) {
    let waveletList = props.presetConfig.wavelets.map((waveletConfig) =>
      <WaveletItem 
        waveletConfig={waveletConfig} 
        key={waveletConfig.id} 
        onWaveletChange={(e) => props.onWaveletChange(waveletConfig.id, e)} 
        onDeleteWaveletClick={() => props.onDeleteWaveletClick(waveletConfig.id)} 
        onSoloWaveletClick={() => props.onSoloWaveletClick(waveletConfig.id)}
        />
    );
    return (
      <div id="PresetItem">
        <div className="form-group">
          <div className="form-row">
            <div className="col-md">
              <input className="form-control form-control-lg" placeholder="Preset Name" type="text" name="name" value={props.presetConfig.name} onChange={props.onPresetNameChange}/>
            </div>
            <div className="col-md-auto">
              <span className="text-muted">Preset ID<br/>{props.presetConfig.id}</span> 
            </div>
            <div className="col-md-auto">
              <button className="btn btn-danger btn-lg" onClick={() => props.onDeletePresetClick(props.presetConfig.id)}>Delete</button>
            </div>
          </div>
        </div>

        {waveletList}

        <button className="btn btn-secondary" onClick={props.onNewWaveletClick}>+ Add new wavelet</button>
      </div>
    );
  } else {
    return (
      <div className="alert alert-info">No preset selected. Choose one from the list, or add a new one.</div>
    );
  }
}

class WaveletItem extends Component
{
  // TODO Extract out the color swatch and picker into a component

  constructor(props) {
    super(props);
    this.state = {
      displayColorPicker: false,
    }
    this.handleColorChangeComplete = this.handleColorChangeComplete.bind(this);
  }

  handleClick = () => {
    this.setState({displayColorPicker: !this.state.displayColorPicker});
  }
  handleClose = () => {
    this.setState({ displayColorPicker: false })
  };
  
  handleColorChangeComplete(data, e) {
    // TODO Look up how to do this properly. The default argument from the color
    // picker is just the color data. There's also a browser mouse event.
    let syntheticEvent = {
      target: {
        name: "color", 
        value: data.hex,
        type: "colorpicker",
      }
    };
    return this.props.onWaveletChange(syntheticEvent);
  }

  render() {
    // From https://casesandberg.github.io/react-color/#examples
    const styles = reactCSS({
      'default': {
        color: {
          background: `${ this.props.waveletConfig.color }`,
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <div className="border rounded p-3 mb-3">
      
        <div className="form-row">
          <div className="form-group col-md">
            <label className="small">Frequency</label>
            <input className="form-control form-control-sm" type="number" step="0.1" value={this.props.waveletConfig.freq} name="freq" onChange={this.props.onWaveletChange}/>
          </div>
          <div className="form-group col-md">
            <label className="small">Wavelength</label>
            <input className="form-control form-control-sm" type="number" step="0.1" value={this.props.waveletConfig.lambda} name="lambda" onChange={this.props.onWaveletChange}/>
          </div>
          <div className="form-group col-md">
            <label className="small">Phase</label>
            <input className="form-control form-control-sm" type="number" step="0.1" value={this.props.waveletConfig.delta} name="delta" onChange={this.props.onWaveletChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="small">Colour</label>
          <div className="form-row">
            <div className="col">
              <button className="btn btn-sm border form-control form-control-sm" style={ styles.color } onClick={ this.handleClick }>&nbsp;</button>
              { this.state.displayColorPicker ? 
                <div style={ styles.popover }>
                  <div style={ styles.cover } onClick={this.handleClose}/>
                  <ChromePicker color={this.props.waveletConfig.color} onChangeComplete={this.handleColorChangeComplete} disableAlpha={true} />
                </div>
                : null }
            </div>
            <div className="col">
              <input className="form-control form-control-sm" type="text" size="3" value={this.props.waveletConfig.color} name="color" onChange={this.props.onWaveletChange}/>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="small">Brightness</label>
          <div className="form-row">
            <div className="col-md-1">
              <span className="form-text small">{Number(this.props.waveletConfig.min).toFixed(2)}</span>
            </div>
            <div className="col-md">
              <input className="form-control form-control-sm" type="range" min="-10" max="10" step="0.01" value={this.props.waveletConfig.min} name="min" onChange={this.props.onWaveletChange}/>
            </div>
            <div className="col-md">
              <input className="form-control form-control-sm" type="range" min="-10" max="10" step="0.01" value={this.props.waveletConfig.max} name="max" onChange={this.props.onWaveletChange}/>
            </div>
            <div className="col-md-1">
              <span className="form-text small">{Number(this.props.waveletConfig.max).toFixed(2)}</span>
            </div>
          </div>
          <div className="form-row d-none">
            <div className="col-md">
              <input className="form-control form-control-sm" type="checkbox" value={this.props.waveletConfig.clip} name="clip" onChange={this.props.onWaveletChange}/>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="small">Position</label>
          <div className="form-row">
            <div className="col-md">
              <input className="form-control form-control-sm" type="number" step="0.1" value={this.props.waveletConfig.x} name="x" onChange={this.props.onWaveletChange}/>
            </div>
            <div className="col-md">
              <input className="form-control form-control-sm" type="number" step="0.1" value={this.props.waveletConfig.y} name="y" onChange={this.props.onWaveletChange}/>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="col">
            <button className={(this.props.waveletConfig.solo ? "active " : "") + "btn btn-outline-primary btn-sm"} onClick={this.props.onSoloWaveletClick}>Solo</button>
          </div>
          <div className="col-auto">
            <span className="text-muted mr-3 small">Wavelet ID {this.props.waveletConfig.id}</span>
            <button className="btn btn-danger btn-sm" onClick={this.props.onDeleteWaveletClick}>Delete</button>
          </div>
        </div>

      </div>
    );  
  }
}

export default App;
