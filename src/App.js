import React, { Component } from 'react';
import reactCSS from 'reactcss'
import { ChromePicker } from 'react-color';
import './App.css';

var shortid = require('shortid');

const defaultWavelet = {
    "id": null,
    "color": "#ffffff",
    "freq": 0.2,
    "lambda": 0.5,
    "delta": 0.0,
    "x": 0.0,
    "y": 0,
    "min": 0.1,
    "max": 0.7
};

const defaultPreset = {
    "id": null,
    "name": "New Preset",
    "wavelets": [],
};

class App extends Component {
  render() {
    return (
      <div className="App">
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
  }

  componentDidMount() {
    this.getPresetList();
  }

  getPresetList() {
    fetch('http://localhost:3000/api/wave_configs/')
      .then((result) => {
        return result.json();
      }).then((jsonresult) => {
        this.setState({presets: jsonresult});
      });
  }

  handlePresetListClick(id) {
    this.setState({currentPreset: id});
    this.setLightPanelMode(id);
    fetch('http://localhost:3000/api/wave_config/'+id)
      .then((result) => {
        return result.json();
      }).then((jsonresult) => {
        this.setState({presetConfig: jsonresult});
      });
  }

  setLightPanelMode(id) {
    fetch('http://localhost:3000/mode/interactive_wave/'+id);    
  }

  handleNewPresetClick() {
    let newPreset = {...defaultPreset};    
    newPreset.id = shortid.generate();
    
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

    fetch('http://localhost:3000/api/wave_config/'+id, {
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
    return this.putData('http://localhost:3000/api/wave_config/'+id, config);
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
      <div className="PresetConfig">
        <PresetList presets={this.state.presets} currentPreset={this.state.currentPreset} onClick={this.handlePresetListClick} onNewPresetClick={this.handleNewPresetClick}/>
        <PresetItem presetConfig={this.state.presetConfig} onWaveletChange={this.handleWaveletChange} onPresetNameChange={this.handlePresetNameChange} onNewWaveletClick={this.handleNewWaveletClick} onDeleteWaveletClick={this.handleDeleteWaveletClick} onDeletePresetClick={this.handleDeletePresetClick}/>
      </div>
    );
  }

}

function PresetList(props)
{
  let presetItems = props.presets.map((preset) =>
    <li key={preset.id} preset-id={preset.id} className={(props.currentPreset === preset.id ? "current" : "")} onClick={() => props.onClick(preset.id)}>{preset.name} ({preset.id})</li>
  );
  return (
    <div id="preset-list">
      <ul>
        {presetItems}
        <li onClick={props.onNewPresetClick}>+ Add new preset</li>
      </ul>
    </div>
  );
}

function PresetItem(props)
{
  if(props.presetConfig) {
    let waveletList = props.presetConfig.wavelets.map((waveletConfig) =>
      <WaveletItem waveletConfig={waveletConfig} key={waveletConfig.id} onWaveletChange={(e) => props.onWaveletChange(waveletConfig.id, e)} onDeleteWaveletClick={() => props.onDeleteWaveletClick(waveletConfig.id)} />
    );
    return (
      <div id="preset-item">
        <p><input type="text" name="name" value={props.presetConfig.name} onChange={props.onPresetNameChange}/> ({props.presetConfig.id}) <span onClick={() => props.onDeletePresetClick(props.presetConfig.id)}>(delete)</span></p>
        {waveletList}
        <div onClick={props.onNewWaveletClick}>+ Add new wavelet</div>
      </div>
    );
  } else {
    return (
      <div id="preset-item">
        <p>Nothing selected.</p>
      </div>      
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
    // TODO Look up how to do this properly. The defauylt argument from the color
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
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `${ this.props.waveletConfig.color }`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
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
      <div className="wavelet-config">
        <div>wavelet id {this.props.waveletConfig.id} <span onClick={this.props.onDeleteWaveletClick}>(delete)</span></div>
        <form>
          <div>
            <label>Freq</label>
            <input type="number" step="0.1" value={this.props.waveletConfig.freq} name="freq" onChange={this.props.onWaveletChange}/>
          </div>
          <div>
            <label>Lambda</label>
            <input type="number" step="0.1" value={this.props.waveletConfig.lambda} name="lambda" onChange={this.props.onWaveletChange}/>
          </div>
          <div>
            <label>Delta</label>
            <input type="number" step="0.1" value={this.props.waveletConfig.delta} name="delta" onChange={this.props.onWaveletChange} />
          </div>
          <div>
            <label>Centre</label>
            <input type="number" step="0.1" value={this.props.waveletConfig.x} name="x" onChange={this.props.onWaveletChange}/> , 
            <input type="number" step="0.1" value={this.props.waveletConfig.y} name="y" onChange={this.props.onWaveletChange}/>
          </div>
          <div>
           <label>Colour</label>
           <input type="text" size="3" value={this.props.waveletConfig.color} name="color" onChange={this.props.onWaveletChange}/>
            <div>
              <div style={ styles.swatch } onClick={ this.handleClick }>
                <div style={ styles.color } />
              </div>
              { this.state.displayColorPicker ? <div style={ styles.popover }>
                <div style={ styles.cover } onClick={this.handleClose}/>
                <ChromePicker color={this.props.waveletConfig.color} onChangeComplete={this.handleColorChangeComplete} disableAlpha={true} />
              </div> : null }
            </div>


          </div>
          <div>
            <label>Brightness</label>
            <input type="range" min="0" max="1" step="0.01" value={this.props.waveletConfig.min} name="min" onChange={this.props.onWaveletChange}/>{Number(this.props.waveletConfig.min).toFixed(2)} to 
            <input type="range" min="0" max="1" step="0.01" value={this.props.waveletConfig.max} name="max" onChange={this.props.onWaveletChange}/>{Number(this.props.waveletConfig.max).toFixed(2)}
          </div>
        </form>
      </div>
    );  
  }
}

export default App;
