import { ethers } from "ethers";
import React from "react";
import { loaderContext } from "../Context/loaderContext";
import { UserContext } from "../Context/userContext";
import { Address } from "../Utils/ContractAddress";
import PublicABI from "../Utils/PublicABI.json";
import PrivateABI from "../Utils/PrivateABI.json";
import axios from "axios";
import { baseUrl } from "../BaseUrl";
import { uploadFileToDb, uploadFileToFolder } from "../Functions/uploadToDB";
import { sliderContext } from "../Context/sliderContext";
import { startEncryption } from "../encFunctions";
import { createClient } from "../Utils/createClient";

export default function Upload({ files }) {
  const { setLoaderState } = React.useContext(loaderContext);
  const [createFolder, setCreateFolder] = React.useState(false);
  const { sliderState } = React.useContext(sliderContext);
  const [folderName, setFolderName] = React.useState("");
  const client = createClient();

  const { user } = React.useContext(UserContext);

  async function handleFileUpload() {
    setLoaderState(true);
    // const fileCids = files.map(async (file) => {
    //   const cid = await client.put([file]);
    //   return {
    //     cid,
    //     name: file?.name,
    //   };
    // });

    const fileCids = [];

    for (let file of files) {
      const cid = await client.put([file]);
      fileCids.push({ cid, name: file.name, size: file.size });
    }

    console.log(fileCids);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      Address.Publicupload[0],
      PublicABI.abi,
      signer
    );
    try {
      console.log(fileCids);
      if (createFolder) {
        var folderObj = await axios.post(`${baseUrl}/api/folder`, {
          name: folderName,
          user,
        });
      }
      for (let fileObj of fileCids) {
        const response = await contract.addcid(fileObj.cid, fileObj.name);
        await response.wait();
        if (!createFolder) {
          await uploadFileToDb({ fileObj, user });
        } else {
          await uploadFileToFolder({ fileObj, user, folderObj });
        }
      }
      console.log("File successfully added to blockchain");
    } catch (error) {
      console.log("Error adding file");
    }

    setLoaderState(false);
  }

  async function handlePrivateFileUpload() {
    setLoaderState(true);
    // const fileCids = files.map(async (file) => {
    //   const cid = await client.put([file]);
    //   return {
    //     cid,
    //     name: file?.name,
    //   };
    // });

    const fileCids = [];

    for (let file of files) {
      var { enc, iv, key } = await startEncryption(file);
      const cid = await client.put([enc]);
      fileCids.push({
        cid,
        name: file.name,
        size: file.size,
        protected: "protected",
      });
    }

    console.log(fileCids);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      Address.privateupload[0],
      PrivateABI.abi,
      signer
    );
    try {
      console.log(fileCids);
      if (createFolder) {
        var folderObj = await axios.post(`${baseUrl}/api/folder`, {
          name: folderName,
          user,
        });
      }
      for (let fileObj of fileCids) {
        const buffer = Buffer.from(iv.buffer);
        const inv = buffer.toString("hex");
        const response = await contract.addcid(
          fileObj.cid,
          fileObj.name,
          key,
          inv
        );
        await response.wait();
        if (!createFolder) {
          console.log(fileObj);
          await uploadFileToDb({ fileObj, user });
        } else {
          await uploadFileToFolder({ fileObj, user, folderObj });
        }
      }
      console.log("File successfully added to blockchain");
    } catch (error) {
      console.log("Error adding file");
    }

    setLoaderState(false);
  }
  return (
    <>
      {createFolder && (
        <input
          placeholder="Folder Name"
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
        />
      )}
      <button onClick={() => setCreateFolder((oldState) => !oldState)}>
        {!createFolder ? "Create Folder" : "Cancel Folder"}
      </button>
      <button
        onClick={() =>
          sliderState === "public"
            ? handleFileUpload()
            : handlePrivateFileUpload()
        }
        disabled={files.length === 0 ? true : false}
      >
        Upload
      </button>
    </>
  );
}
