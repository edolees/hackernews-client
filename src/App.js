import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSync,faCaretUp,faCaretDown,faSpinner, faArrowAltCircleDown, faArrowAltCircleUp, faDotCircle } from '@fortawesome/free-solid-svg-icons'
import  axios from 'axios';
import PropTypes from 'prop-types'
import {sortBy} from 'lodash'
import classNames from 'classnames'
import './App.css';
import 'bulma/css/bulma.css'


library.add(fab,faCaretUp,faCaretDown,faSpinner, faArrowAltCircleUp,faArrowAltCircleDown,faDotCircle,faSync,)

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP= '100';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH ='/search';
const PARAM_SEARCH = 'query='
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';


const largeColumn ={
  width:'40%',
};

const mediumColumn ={
  width:'30%',
};

const smallColumn ={
  width:'10%',
};

const Sorts = {
  NONE : list => list ,
  TITLE : list => sortBy(list,'title'),
  AUTHOR : list => sortBy(list, 'author'),
  COMMENTS : list => sortBy(list, 'num_comments').reverse(),
  POINTS : list => sortBy(list, 'points').reverse(),
}

const updateSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;

  const oldHits = results && results[searchKey]
    ? results[searchKey].hits
    : [];

  const updatedHits = [
    ...oldHits,
    ...hits
  ];

  return {
    results: {
      ...results,
      [searchKey]: { hits: updatedHits, page }
    },
    isLoading: false
  };
};

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading:false,
    };
    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchChange= this.onSearchChange.bind(this);
    this.onSearchSubmit= this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);

  }
  
  needsToSearchTopStories(searchTerm){
    return !this.state.results[searchTerm];
  }

  setSearchTopStories(result){
    const {hits, page} = result;
    this.setState(updateSearchTopStoriesState(hits, page));
  }

  fetchSearchTopStories(searchTerm , page = 0){
    this.setState({isLoading: true})
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
    .then(result => this.setSearchTopStories(result.data))
    .catch(error => this.setState({error}))
  }
  
  componentDidMount(){
    const {searchTerm} = this.state;
    this.setState({ searchKey: searchTerm })
    this.fetchSearchTopStories(searchTerm);
  }
  
  onSearchSubmit(event){
    const {searchTerm} = this.state;
    this.setState({searchKey: searchTerm });
    
    if (this.needsToSearchTopStories(searchTerm)){
      this.fetchSearchTopStories(searchTerm);
    }

    event.preventDefault();
  }
  
  onSearchChange(event){
    this.setState({ searchTerm : event.target.value });
  }
  onDismiss(id){
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    
    this.setState({
      results: {
        ...results,
        [searchKey]:  {hits: updatedHits , page}
      }
    });
  }
  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error,
      isLoading,
      } = this.state
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
      ) || 0;
    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];
    if (error){return <p>Something went wrong..</p>} 
    return (
      <div className="page">
        <div className="interactions">
        <Search
          value={searchTerm}
          onChange={this.onSearchChange}
          onSubmit={this.onSearchSubmit}
        >
        Search
        </Search>
        </div>
        {error?
          <div>
            <p>Something went wrong..</p>
          </div>
          :<Table
          list={list}
          onDismiss={this.onDismiss}
          />
          } 
        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
            className= "button is-info"
            >
            More
          </ButtonWithLoading>
        </div>
     </div>
    )
  }
}
class Search extends Component{
  componentDidMount(){
    if(this.input){
      this.input.focus();
    }
  }
  render (){
    const { 
      value,
      onChange,
      children, 
      onSubmit, 
    } = this.props;
    return (
    <form onSubmit={onSubmit}>
    <div className="field has-addons has-addons-centered">
      <div className="control">
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={el => this.input = el}
        />
      </div>
      <div className="control">
        <button 
        type="submit"
          className="button is-info"
        >{children}</button>
      </div>
      </div>
      </form>
    );
  }
} 
Search.propTypes = {
  value: PropTypes.string,
  children : PropTypes.node.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};
class Table extends Component {
  constructor(props) {
    super(props);
    this.state= {
      sortKey : 'NONE',
      isSortReverse: false,

    }
    this.onSort = this.onSort.bind(this);
  }
    onSort(sortKey) {
      const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;

      this.setState({
        sortKey,
        isSortReverse
      });
    }
  
  render (){
    const{
      list,
      onDismiss,
      } = this.props
    const{
       sortKey,
       isSortReverse,
    } = this.state

    const sortedList = Sorts[sortKey](list);

    const reverseSortedList = isSortReverse?
      sortedList.reverse():
      sortedList;
    return (

  <div className="table">
    <div className ="table-header">

      <span style ={{width: '40%'}}>
        <Sort 
          sortKey=  {'TITLE'}
          onSort= {this.onSort}
          activeSortKey = {sortKey}
          isSortReverse={isSortReverse}
        >
         {" "}Title
        </Sort>
      </span>

      <span style ={{width: '30%'}}>
        <Sort 
          sortKey=  {'AUTHOR'}
          onSort= {this.onSort}
          activeSortKey = {sortKey}
          isSortReverse={isSortReverse}
        >
         {" "}Author
        </Sort>
      </span>
    
      <span 
      style ={{width: '10%'}}>
        <Sort 
          sortKey=  {'COMMENTS'}
          onSort= {this.onSort}
          activeSortKey = {sortKey}
          isSortReverse={isSortReverse}
        >
         {" "}Comments
        </Sort>
      </span>
    
      <span style ={{width: '10%'}}>
        <Sort 
          sortKey=  {'POINTS'}
          onSort= {this.onSort}
          activeSortKey = {sortKey}
          isSortReverse={isSortReverse}
        >
         {" "}Points
        </Sort>
      </span>
    
      <span style={{width:  '10%'}}>    
      </span>
    </div>
    
    {reverseSortedList.map(item =>
      <div key={item.objectID} className="table-row">
        <span style = {largeColumn}>
          <a href={item.url}>{item.title}</a>
        </span>
        <span style = {mediumColumn}>{item.author}</span>
        <span style = {smallColumn}>{item.num_comments}</span>
        <span style = {smallColumn}>{item.points}</span>
        <span style = {smallColumn}>
          <Button onClick={()=> 
          onDismiss(item.objectID)}
          className="delete is-medium"
          >
          </Button>
        </span>          
      </div>
    )};
  </div>
    ); 
  }
}
  Table.propTypes = {
    list : PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
    ).isRequired,
    onDismiss : PropTypes.func.isRequired,
  }
    
const Button =({onClick,className,children}) =>
  <button
    onClick ={onClick}
    className={className}
    type="button">
    {children}
  </button>

  Button.defaultProps ={
    className : '',
  }

  Button.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    children : PropTypes.node,
  };
const Loading = () =>
  <div 
  style= {{fontSize:'80px'}}>
    < FontAwesomeIcon icon ="spinner" spin / 
    >
      
  </div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
  ? <Loading />
  : <Component { ...rest } />

const ButtonWithLoading = withLoading(Button);

const Sort = ({
  sortKey,
  activeSortKey,
  onSort,
  children,
  isSortReverse,
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  );

  return (
    <Button
      onClick={() => onSort(sortKey)} style={{ cursor: 'pointer' }} className={sortClass}
    >{sortKey === activeSortKey
      ? <FontAwesomeIcon
        icon = {
          isSortReverse ? faCaretUp : faCaretDown
        }
        style={{ verticalAlign: 'middle' }}
      />
      : ''}
    {children}
    </Button>
  );
}
export default App;
export {
  Button,
  Search,
  Table};