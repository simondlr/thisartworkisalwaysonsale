import React from 'react';
import { Link } from 'react-router-dom';

export default function Account(props) {
  return (
    <div className="account">
      <span className="accountLink"><Link style={{verticalAlign:'middle'}} to="/">THIS ARTWORK IS ALWAYS ON SALE</Link></span>
      <w3m-button balance="hide" size="sm" style={{float:'right'}}/>
    </div>
  );
  
}
