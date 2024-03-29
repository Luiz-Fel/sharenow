import React, { useState, useEffect } from "react";
import { MdDownloadForOffline } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { client, urlFor } from "../client";
import MasonryLayout from "./MasonryLayout";
import { pinDetailMorePinQuery, pinDetailQuery } from "../utils/data.js";
import Spinner from "./Spinner";

function PinDetail({ userInfo }) {
  const [pins, setPins] = useState(null);
  const [pinDetails, setPinDetails] = useState(null);
  const [comment, setComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const { pinId } = useParams();

  const pinsOptions = {
    pins : <>
            <h2 className="text-center font-bold text-2xl mt-8 mb-4">
              More like this
            </h2>
            <MasonryLayout pins={pins} />
          </>,
    loading: <Spinner message="Loading pins..." />,
    noPins: <h2 className="text-center font-bold text-2xl mt-8 mb-4">No pins avaiable</h2>
  }

  const addComment = () => {
    setAddingComment(true);
    client
      .patch(pinId)
      .setIfMissing({ comments: [] })
      .insert("after", "comments[-1]", [
        {
          comment,
          _key: uuidv4(),
          postedBy: {
            _type: "reference",
            _ref: userInfo._id,
          },
        },
      ])
      .commit()
      .then(() => {
        fetchPinDetails();
        setComment("");
        setAddingComment(false);
      });
  };
  const fetchPinDetails = () => {
    const query = pinDetailQuery(pinId);

    if (query) {
      client.fetch(query).then((data) => {
        setPinDetails(data[0]);

        if (data[0]) {
          const otherquery = pinDetailMorePinQuery(data[0]);
          if (otherquery) {

            client.fetch(otherquery).then((res) => setPins(res));
          } else {
            setPins([]);
          }
        }
      });
    }
  };

  useEffect(() => {
    fetchPinDetails();
  }, [pinId]);

  if (!pinDetails) return <Spinner message="Loading pin..." />;
  return (
    <>
      <div
        className="flex xl:flex-row flex-col m-auto bg-white"
        style={{ maxWidth: "1500px", borderRadius: "32" }}
      >
        <div className="flex justify-center items-center md:items-start flex-initial">
          <img
            src={pinDetails?.image && urlFor(pinDetails.image).url()}
            alt="user-post"
            className="rounded-t-3xl rounded-b-lg"
          />
        </div>
        <div className="w-full p-5 flex-1 xl:min-w-620">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <a
                className="transition-all bg-white px-3 py-2 rounded-full flex items-center justify-center gap-2 text-dark tex-xl opacity-75 hover:opacity-100 hover:shadow-md outline-none "
                href={`${pinDetails.image?.asset?.url}?dl=`}
                download
                onClick={(e) => e.stopPropagation()}
              >
                <p className="font-semibold">Download</p>
                <MdDownloadForOffline className="" />
              </a>
            </div>
            <a href={pinDetails.destination} target=" blank" rel="noreferrer">
              {pinDetails.destination}
            </a>
          </div>
          <div>
            <h1 className="text-4xl font-bold break-words mt-3">
              {pinDetails.title}
            </h1>
            <p className="mt-3">{pinDetails.about}</p>
          </div>
          <Link
            to={`/profile/${pinDetails.postedBy?._id}`}
            className="flex gap-2 mt-5 items-center bg-white rounded-lg"
          >
            <img
              src={pinDetails.postedBy?.image}
              alt="user-image"
              className="w-8 h-8 rounded-full object-cover"
            />
            <p className="font-semibold capitalize">
              {pinDetails.postedBy.username}
            </p>
          </Link>
          <h2 className="mt-5 text-2xl">Comments</h2>
          <div className="max-h-370 overflow-y-auto">
            {pinDetails?.comments?.map((comment, i) => (
              <div
                className="flex gap-2 mt-5 items-center bg-white rounded-lg"
                key={i}
              >
                <img
                  src={comment.postedBy?.image}
                  alt="user-image"
                  className="w-10 h-10 object-cover rounded-full cursor-pointer"
                />
                <div className="flex flex-col">
                  <p className="font-bold">{comment.postedBy.username}</p>
                  <p>{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap mt-6 gap-3 items">
            <Link to={`/profile/${pinDetails.postedBy?._id}`}>
              <img
                src={userInfo?.image}
                alt="user-image"
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </Link>
            <input
              type="text"
              className="flex-1 border-gray-100 outline-none border-2 p-2 rounded-2xl focus:border-gray-100"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              className="bg-red-500 text-white rounded-full px-6 py-3 font-semibold text-base outline-none"
              onClick={addComment}
            >
              {addingComment ? "Posting the comment..." : "Post"}
            </button>
          </div>
        </div>
      </div>
      {pins?.length > 0 ? pinsOptions.pins : null}
      {!pins?.length &&
        (pins?.length === 0 ? pinsOptions.noPins : pinsOptions.loading)
      }
    </>
  );
}

export default PinDetail;
